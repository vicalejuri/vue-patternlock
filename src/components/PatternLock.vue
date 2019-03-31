<template>
	<div
		class="patternlock"
		@pointerenter="calculateBounds"
		@pointerdown.passive="touchdown"
		@pointerup.passive="touchup"
		@pointermove.passive="touchmove"
	>
		<div class="patternlock__debug" ref="debug"></div>
		<div class="patternlock__container" ref="container">
			<div class="quadrant debug" v-for="point in points" :key="point.uid">
				<div class="hitbox-point" @pointerover.self.passive="(ev) => markPin(ev, point)">
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
import { fnv1a } from "@/utils";

import shortid from "shortid";
import { svg, html } from "lighterhtml";

import Point, { Vector } from "./Point";
import Edge from "./Edge";

const PRECISION = 2;

@Component
export default class PatternLock extends Vue {
	public name = "pattern-lock";

	/**
	 * A seed used to make pattern-lock guessing via rainbow tables harder.
	 * @important
	 */
	@Prop({ default: "SEED_CHANGE_ME_TO_USERNAME_OR_OTHER_SECRET" })
	private seed!: string;

	@Prop({ default: 0.01 })
	private strokeWidth!: number;

	@Prop({ default: "blue" })
	private strokeColor!: string;

	@Prop({ default: 6 })
	private maxMovements!: number;

	// all points
	private points: Point[] = [];

	// Edges are 2 connected points, used to create a strong password
	private edges: Edge[] = [];
	private lastMarkedPoint: Point | null = null;

	// Line Path
	private line: Vector[] = [];
	private cursor: Vector = [0, 0];

	private containerRect!: ClientRect;
	private isPointerdown: boolean = false;

	public constructor() {
		super();

		// Seed shortid before creating values for points
		shortid.seed(fnv1a(this.seed));

		for (let i = 0; i < 9; i++) {
			this.points.push(new Point(shortid.generate()));
		}
	}

	public mounted() {
		// Retrieve container size in screen space
		this.containerRect = (this.$refs
			.container as HTMLElement).getBoundingClientRect();

		// Retrieve points position after mount
	}

	private vectorToStr(v: Vector): string {
		return (
			v[0] + //.toFixed(PRECISION)
			" " +
			v[1] //.toFixed(PRECISION)
		);
	}

	private addEdge(p1: Point, p2: Point): void {
		this.edges.push(new Edge(p1, p2));
	}

	private generatePatternHash(): void {
		const hash = "1234567891022234123";
		this.$emit("pattern", hash);
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

		const lastIdx = this.line.length - 1;
		Vue.set(this.line, lastIdx, posLocal);
	}

	private touchup(ev: PointerEvent) {
		console.log("touchup");

		// Clear all points
		this.points.forEach(p => p.reset());

		this.line = [];
		this.isPointerdown = false;
	}

	/**
	 * Mark a pin
	 */
	private markPin(ev: PointerEvent, point: Point) {
		// Avoid marking Pin twice
		if (!this.isPointerdown) {
			return;
		}
		if (point.checked) {
			return;
		}

		// Set point marked
		point.checked = true;

		// Get position of point in screen
		const targetPos = (ev.target as HTMLElement).getBoundingClientRect();
		console.log(ev.target);
		const posScreen: Vector = [
			targetPos.left + targetPos.width / 2,
			targetPos.top + targetPos.height / 2
		];
		const posLocal: Vector = this.screenPositionNormalized(posScreen);
		point.pos = posLocal;

		// Add point to svg path
		const lastIdx = this.line.length - 1;
		Vue.set(this.line, lastIdx, posLocal);
		this.line = [...this.line, posLocal];

		// Already have previous pin marked?
		// Create a new edge
		if (this.lastMarkedPoint !== null) {
			this.addEdge(this.lastMarkedPoint, point);
		} else {
			this.lastMarkedPoint = new Point("I");
			this.lastMarkedPoint.pos = posScreen;
		}

		// If already has sufficient movements, generate HashPasword
		if (this.line.length >= this.maxMovements + 1) {
			this.generatePatternHash();
			this.edges = [];
			// this.touchup(new PointerEvent('touchup'))

			// Regenerate bounds, container may be changed location
			this.calculateBounds(new PointerEvent("touchenter"));
		}
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
