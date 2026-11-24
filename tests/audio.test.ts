import { describe, expect, it } from 'vitest'
import { moetHervatten } from '../src/lib/audio'

describe('moetHervatten', () => {
  it('hervat een geschorste of (op iOS) onderbroken context', () => {
    expect(moetHervatten('suspended')).toBe(true)
    expect(moetHervatten('interrupted')).toBe(true)
  })

  it('laat een lopende of gesloten context met rust', () => {
    expect(moetHervatten('running')).toBe(false)
    expect(moetHervatten('closed')).toBe(false)
  })
})
