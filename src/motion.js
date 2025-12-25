import { Capacitor } from "@capacitor/core";
import { Motion } from "@capacitor/motion";

// Comprobar si estamos en entorno nativo
const isNative = () => Capacitor.isNativePlatform();

export async function motionRequestPermission() {
  if (!isNative()) return { granted: false, reason: "web" };

  try {
    // Por si IOS pide permiso explícito
    const perm = await Motion.requestPermissions();
    // Devolvemos el resultado de la petición de permiso
    return { granted: true, perm };
  } catch (e) {
    console.log("Motion permission error:", e);
    return { granted: false, error: e };
  }
}

/**
 * Suscribe orientación (alpha/beta/gamma):
 * alpha = rotación alrededor del eje Z (0..360)
 * beta  = inclinación adelante/atrás (-180..180)
 * gamma = inclinación izquierda/derecha (-90..90)
 */
export async function motionStartOrientation(onChange) {
  if (!isNative()) return () => {};

  const handler = (event) => {
    const o = event?.rotationRate ?? event; // según plataforma/versión
    // event.alpha, event.beta, event.gamma
    onChange({
      alpha: event?.alpha ?? 0,
      beta: event?.beta ?? 0,
      gamma: event?.gamma ?? 0,
    });
  };

  await Motion.addListener("orientation", handler);

  return async () => {
    await Motion.removeAllListeners();
  };
}