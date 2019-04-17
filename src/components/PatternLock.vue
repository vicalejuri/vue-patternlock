<template>
	<div
		:class="style"
		@pointerenter="calculateBounds"
		@pointerdown.passive="touchdown"
		@pointerup.passive="touchup"
		@pointermove.passive="touchmove"
	>
		<div class="patternlock__debug" ref="debug"></div>
		<div class="patternlock__container" ref="container">
			<div class="quadrant debug" v-for="point in points" :key="point.uid">
				<div class="hitbox-point" @pointerenter.self.passive="(ev) => markPin(ev, point)">
					<button class="point" :aria-toggled="point.checked"/>
				</div>
			</div>
			<svg class="line-container" viewBox="0 0 1 1" ref="svgContainer">
				<path ref="path" :d="linePath" fill="none" :stroke="strokeColor" :stroke-width="strokeWidth"></path>
			</svg>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

import MersenneTwister from "mersenne-twister";

import { fnv1a, tap, hashDigest, str2Uint32 } from "@/utils";
import Point, { Vector } from "@/core/Point";
import Edge from "@/core/Edge";

const PRECISION = 3;

/**
 * Status for success, error and blank pattern.
 * Use this to customize style of pattern lock based on success/error
 */
export enum PatternStatus {
	empty = "pattern-empty",
	success = "pattern-success",
	error = "pattern-error"
}

@Component
export default class PatternLock extends Vue {
	public name = "pattern-lock";

	/**
	 * A KEY used to make pattern-lock guessing via rainbow tables much harder.
	 * It will also be used as HMAC key, to sign the pattern digest.
	 *  A use case, is using the same KEY only 5 times, and when exceeded, you
	 *  can make user wait to create a new key.
	 * @important
	 */
	// all points
	public points: Point[] = [];

	@Prop({ default: PatternStatus.empty })
	public status!: PatternStatus;

	@Prop()
	private hmackey!: string;

	@Prop({ default: 0.01 })
	private strokeWidth!: number;

	@Prop({ default: "white" })
	private strokeColor!: string;

	@Prop({ default: 6 })
	private maxMovements!: number;

	private seed: number;
	private pseudorandom: MersenneTwister;

	// Edges are 2 connected points, used to create a strong password
	private edges: Edge[] = [];
	private previousMarkedPoint: Point | null = null;
	private lastMarkedPoint: Point | null = null;

	// Line Path
	private line: Vector[] = [];
	private cursor: Vector = [0, 0];

	private containerRect!: ClientRect;
	private isPointerdown: boolean = false;

	public constructor() {
		super();

		// Use key as a seed to create reproducible points hash
		this.seed = str2Uint32(this.hmackey);
		this.pseudorandom = new MersenneTwister(this.seed);

		for (let i = 0; i < 9; i++) {
			const uid = this.pseudorandom.random_int();
			this.points.push(new Point(uid));
		}
	}

	public mounted() {
		// Retrieve container size in screen space
		this.containerRect = (this.$refs
			.container as HTMLElement).getBoundingClientRect();

		// Retrieve points position after mount
	}

	public get style(): string {
		return ["patternlock", this.status].join(" ");
	}

	/**
	 * Mark a pin
	 */
	public markPin(ev: PointerEvent, point: Point) {
		if (!this.isPointerdown) {
			return;
		}
		// Avoid marking Pin twice
		if (point.checked) {
			return;
		} else {
			point.checked = true;
		}

		// Get touch position
		const touchLocal: Vector = this.screenPositionToLocal([
			ev.clientX,
			ev.clientY
		]);

		// Get position of point in screen
		const targetPos = (ev.target as HTMLElement).getBoundingClientRect();
		const posScreen: Vector = [
			targetPos.left + targetPos.width / 2,
			targetPos.top + targetPos.height / 2
		];
		const posLocal: Vector = this.screenPositionNormalized(posScreen);

		// Set position of point in normalized coordinates
		point.pos = posLocal;

		// Already have previous pin marked?
		// Create a new edge
		if (this.lastMarkedPoint !== null) {
			// Set end point to posLocal, and create a new startPoint
			const lastIdx = this.line.length - 1;
			Vue.set(this.line, lastIdx, posLocal);
			this.line = [...this.line, posLocal];

			// Clone lastMarkedPoint
			this.addEdge(this.lastMarkedPoint, point);
		} else {
			// Create a new line from this point
			this.line = [posLocal, touchLocal];
		}

		// Walk points forward{}
		if (this.previousMarkedPoint === null) {
			this.previousMarkedPoint = point;
		} else {
			this.previousMarkedPoint = this.lastMarkedPoint;
			this.lastMarkedPoint = point;
		}

		// If already has sufficient movements, generate HashPasword
		console.log("lines length", this.line.length);
		if (this.line.length === this.maxMovements + 1) {
			this.generatePatternHash().then(hash => {
				this.$emit("drawComplete", hash);

				// Clear old points and edges
				this.clear();

				// Regenerate bounds, container may be changed location
				this.calculateBounds(new PointerEvent("touchenter"));
			});
		}
	}

	private vectorToStr(v: Vector): string {
		return v[0].toFixed(PRECISION) + " " + v[1].toFixed(PRECISION);
	}

	private addEdge(p1: Point, p2: Point): void {
		console.log(p1 + " -> " + p2);
		this.edges.push(new Edge(p1, p2));
	}

	private generatePatternHash(): Promise<string> {
		// Sum all edges, and transform to string of minimum 16 characters
		const passnumber = this.edges
			.map(tap(console.log))
			.map(e1 => e1.valueOf())
			.map(tap(console.log))
			.reduce((a, b) => (a + b) % Number.MAX_SAFE_INTEGER)
			.toString();

		return new Promise<string>((resolve, reject) => {
			const hash = hashDigest(passnumber);
			resolve(hash);
		});
	}

	private calculateBounds(ev: PointerEvent) {
		// Retrieve container size in screen space
		this.containerRect = (this.$refs
			.container as HTMLElement).getBoundingClientRect();
	}

	/**
	 * SVG linepath
	 */
	private get linePath() {
		if (this.line.length >= 1) {
			const firstPoint = this.line[0];
			// move to (start point)
			return (
				`M ${this.vectorToStr(firstPoint)}` +
				// draw line foreach(point in path)
				this.line.slice(1).map((l: Vector) => ` L ${this.vectorToStr(l)}`) +
				// Finish
				""
			);
		}
	}

	/**
	 * Convert from screen space to local coordinates(relative to container abs position)
	 */
	private screenPositionToLocal(screenPos: Vector): Vector {
		return [
			screenPos[0] - this.containerRect.left,
			screenPos[1] - this.containerRect.top
		];
	}

	/**
	 * Convert from screen space to normalized [0,1] coordinates
	 */
	private screenPositionNormalized(screenPos: Vector): Vector {
		const posNormal: Vector = this.screenPositionToLocal(screenPos);
		const normX = posNormal[0] / this.containerRect.width;
		const normY = posNormal[1] / this.containerRect.height;

		return [normX, normY];
	}

	/**
	 * Pattern drawing handling
	 */
	private touchdown(ev: PointerEvent) {
		const posScreen: Vector = [ev.clientX, ev.clientY];
		const posLocal: Vector = this.screenPositionNormalized(posScreen);

		this.line = [posLocal, posLocal];
		this.isPointerdown = true;
	}

	/**
	 * Draw line last segment
	 */
	private touchmove(ev: PointerEvent) {
		const posScreen: Vector = [ev.clientX, ev.clientY];
		const posRelative: Vector = this.screenPositionToLocal(posScreen);
		const posLocal: Vector = this.screenPositionNormalized(posScreen);

		if (!this.isPointerdown) {
			return;
		}

		// Set last point of line to current mouse position
		const lastIdx = this.line.length - 1;
		Vue.set(this.line, lastIdx, posLocal);
	}

	private touchup(ev: PointerEvent) {
		this.clear();
	}

	private clear() {
		// Clear all points and edges
		this.edges = [];
		this.points.forEach(p => p.reset());

		this.line = [];
		this.isPointerdown = false;
		this.lastMarkedPoint = null;
		this.previousMarkedPoint = null;
	}
}
</script>

<style lang="scss">
	.patternlock {
		--padding: 50px;
		--ballsize: 0.5rem;
		--hitbox: calc(2.5 * var(--ballsize));
		--background: #000;
		--dots: #fff;
		--success: #b4d455;
		--error: #e4504a;

		display: flex;
		padding: var(--padding);
		background-color: var(--background);
		user-select: none;
		position: relative;
		overflow: hidden;

		&__container {
			position: relative;
			display: grid;
			width: 100%;
			grid-template-rows: 1fr 1fr 1fr;
			grid-template-columns: 1fr 1fr 1fr;
		}

		&__debug {
			position: absolute;
			top: var(--padding);
			left: var(--padding);
			bottom: var(--padding);
			right: var(--padding);
			background-color: rgba(0, 255, 0, 0.3);

			& .cursor {
				position: absolute;
				width: 16px;
				height: 16px;
				background-color: tomato;
			}
		}

		.quadrant {
			display: flex;
			align-items: center;
			justify-content: center;
			touch-action: none;
			z-index: 1;

			&.debug {
				outline: 1px dashed #bbbbbb;
			}
		}

		.hitbox-point {
			width: var(--hitbox);
			height: var(--hitbox);
			background-color: transparent;
			padding: 0;
			border: 0;
			border: 1px solid red;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.point {
			padding: 0;
			border: 0;
			outline: 0;
			width: var(--ballsize);
			height: var(--ballsize);
			background-color: var(--dots);
			border-radius: 50%;
			overflow: hidden;
		}

		.line-container {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			overflow: visible;
			pointer-events: none;
		}
	}
</style>
