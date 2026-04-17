import { describe, it, expect } from 'vitest'
import { colors } from '@/lib/theme/colors'

describe('Design Token Colors', () => {
  describe('primary / brand', () => {
    it('has golden brand color', () => {
      expect(colors.primary.brand).toBe('#F0C14B')
      expect(colors.primary.brandDark).toBe('#D4A72C')
    })
  })

  describe('CTA colors', () => {
    it('has dark navy action background', () => {
      expect(colors.cta.actionBg).toBe('#1A1A2E')
      expect(colors.cta.actionBgHover).toBe('#12122A')
      expect(colors.cta.actionText).toBe('#FFFFFF')
    })
  })

  describe('neutral palette', () => {
    it('has correct gray scale', () => {
      expect(colors.neutral.white).toBe('#FFFFFF')
      expect(colors.neutral.gray50).toBe('#F7F7F8')
      expect(colors.neutral.gray100).toBe('#F0F0F2')
      expect(colors.neutral.gray200).toBe('#E4E4E8')
      expect(colors.neutral.gray300).toBe('#CBCBD1')
      expect(colors.neutral.gray400).toBe('#9898A3')
      expect(colors.neutral.gray500).toBe('#6B6B78')
      expect(colors.neutral.gray700).toBe('#3A3A47')
      expect(colors.neutral.gray900).toBe('#1A1A2E')
    })
  })

  describe('backgrounds', () => {
    it('has correct page and sidebar backgrounds', () => {
      expect(colors.backgrounds.page).toBe('#F7F7F8')
      expect(colors.backgrounds.sidebar).toBe('#1A1A2E')
      expect(colors.backgrounds.card).toBe('#FFFFFF')
    })
  })

  describe('text colors', () => {
    it('has correct text hierarchy', () => {
      expect(colors.text.primary).toBe('#1A1A2E')
      expect(colors.text.secondary).toBe('#6B6B78')
      expect(colors.text.tertiary).toBe('#9898A3')
      expect(colors.text.onDark).toBe('#FFFFFF')
      expect(colors.text.onDarkMuted).toBe('#A8A8BB')
      expect(colors.text.link).toBe('#3B82F6')
    })
  })

  describe('status colors', () => {
    it('has active status colors', () => {
      expect(colors.status.activeBackground).toBe('#DCFCE7')
      expect(colors.status.activeText).toBe('#15803D')
      expect(colors.status.activeDot).toBe('#22C55E')
    })

    it('has expired status colors', () => {
      expect(colors.status.expiredBackground).toBe('#FEE2E2')
      expect(colors.status.expiredText).toBe('#991B1B')
    })
  })

  describe('semantic colors', () => {
    it('has positive/negative/warning/info', () => {
      expect(colors.semantic.positive).toBe('#22C55E')
      expect(colors.semantic.negative).toBe('#EF4444')
      expect(colors.semantic.warning).toBe('#F59E0B')
      expect(colors.semantic.info).toBe('#3B82F6')
    })
  })

  describe('border colors', () => {
    it('has correct border tokens', () => {
      expect(colors.border.default).toBe('#E4E4E8')
      expect(colors.border.subtle).toBe('#F0F0F2')
      expect(colors.border.strong).toBe('#CBCBD1')
    })
  })
})
