import { useState } from 'react'
import spacecraftApi from '../api/spacecraftApi'

// Fase 1: "recibir la nave" son dos pasos idempotentes contra dos backends distintos — primero
// se cierra el lado del taller (Python: reparación → ENTREGADA) y recién después se avisa a
// spacecraftSystem (Java: nave → OPERATIVA). Si el segundo paso falla (o el usuario cierra el
// modal a mitad de camino), reintentar es seguro: ambos endpoints toleran llamarse de nuevo
// sobre un estado ya alcanzado.
export default function ReceiveShipButton({ repairId, spacecraftId, onReceived }) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function handleReceive() {
    setBusy(true)
    setNotice('')
    try {
      await spacecraftApi.receiveShipFromTaller(repairId)
      await spacecraftApi.confirmShipOperational(spacecraftId)
      onReceived?.()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="receive-ship-block">
      {notice && <p className="field-error">{notice}</p>}
      <button type="button" className="btn btn-primary btn-schedule" onClick={handleReceive} disabled={busy}>
        {busy ? 'Recibiendo…' : '🚀 Recibir nave del taller'}
      </button>
    </div>
  )
}
