import { moetHervatten } from '../lib/audio'

let context: AudioContext | null = null

// Met 'playback' klinkt Web Audio op iOS ook als de stilteschakelaar aan staat. Muziek op de achtergrond stopt dan,
// maar je start het geluid hier zelf (gitaar, metronoom), dus dat is wat je wilt.
function zetAfspeelsessie() {
  const sessie = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (!sessie) return
  try {
    sessie.type = 'playback'
  } catch {
    // Een browser die het type niet kent: dan maar zoals het was.
  }
}

/**
 * Eén gedeelde AudioContext, pas gemaakt bij het eerste gebruik. Browsers starten hem geschorst tot er een
 * gebruikersactie is geweest; daarom bij elk gebruik `resume()`.
 */
export function geefAudioContext(): AudioContext {
  zetAfspeelsessie()
  if (!context) {
    const Maker = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    context = new Maker()
  }
  if (moetHervatten(context.state)) void context.resume()
  return context
}
