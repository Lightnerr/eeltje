let context: AudioContext | null = null

/**
 * Eén gedeelde AudioContext, pas gemaakt bij het eerste gebruik. Browsers starten hem geschorst tot er een
 * gebruikersactie is geweest; daarom bij elk gebruik `resume()`.
 */
export function geefAudioContext(): AudioContext {
  if (!context) {
    const Maker = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    context = new Maker()
  }
  if (context.state === 'suspended') void context.resume()
  return context
}
