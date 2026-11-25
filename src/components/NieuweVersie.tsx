import './NieuweVersie.css'

export function NieuweVersie({ herlaad }: { herlaad: () => void }) {
  return (
    <div className="kaart nieuwe-versie" role="status">
      <p>Er is een nieuwe versie van Eeltje.</p>
      <button type="button" className="knop" onClick={herlaad}>
        Herladen
      </button>
    </div>
  )
}
