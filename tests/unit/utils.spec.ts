import { hashDigest } from '@/utils'

describe('utils.ts:hashDigest', () => {
  it(' Should calculate a valid sha256 hex digest', () => {
    const digest = hashDigest('A SIMPLE PASSWORD')
    expect(digest).toBe('3d8ac2e7a24897aaa9f12b621d8f6e7d657c5d1752e026840f0bfe94ae1ca8fe')

    const digest2 = hashDigest('qwertyuiop')
    expect(digest2).toBe('9a900403ac313ba27a1bc81f0932652b8020dac92c234d98fa0b06bf0040ecfd')

    const digest3 = hashDigest('')
    expect(digest3).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')

    expect(digest3.length).toBe(64)
  })
})