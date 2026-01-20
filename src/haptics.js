import {Haptics, ImpactStyle } from '@capacitor/haptics';

// Vibración suave para monedas
export async function hapticsImpactLight() {
    try {
        await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
        console.warn("Haptics Impact Light not supported:", error);
    }
}

// Vibración fuerte (para game over)
export async function hapticsImpactHeavy(){
    try {
        await Haptics.vibrate({ duration: 500 });
    } catch (error) {
        console.warn("Haptics Impact Heavy not supported:", error);
    }
}