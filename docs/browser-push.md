# Naršyklės stumdomi pranešimai

Žiniatinklio konsolė naudoja `usePushSubscription` kabliuką (`apps/web/src/features/notifications/usePushSubscription.ts`) naršyklės pranešimų prenumeratoms registruoti. Kabliukas iškviečia `POST /notifications/subscriptions`, perduoda naršyklės/Firebase sugeneruotą žetoną ir leidžia atšaukti prenumeratą per `DELETE /notifications/subscriptions/:id`. API atsakymas į `POST` grąžina tiek prenumeratos identifikatorių, tiek žetoną – kabliukas abu išsaugo (`subscriptionId` ir `token` laukuose), todėl ID galima panaudoti vėlesniam atšaukimui. Toliau pateikiami žingsniai, kaip sukonfigūruoti aplinką ir integruoti kabliuką su Firebase Cloud Messaging (FCM) arba kitu Web Push tiekėju.

## Paruošimas

1. **Firebase projektas.** Sukurkite arba pasirinkite esamą projektą Firebase konsolėje ir įjunkite Cloud Messaging modulį. Sukurkite Web programėlę, atsisiųskite `firebaseConfig` reikšmes ir sugeneruokite VAPID viešąjį raktą (Settings → Cloud Messaging → Web configuration).
2. **Service worker.** Į projektą įtraukite FCM service worker failą, pvz. `firebase-messaging-sw.js`, kuriame inicializuojamas `firebase/app` ir `firebase/messaging`. Vite distribucijai tokį failą patalpinkite `apps/web/public` kataloge, kad būtų pasiekiamas per `/firebase-messaging-sw.js`.
3. **Aplinkos kintamieji.** Pridėkite `VITE_FIREBASE_` reikšmes prie `apps/web/.env` (arba `.env.local`) failo ir pasirūpinkite, kad `VITE_API_BASE_URL` rodytų į NestJS API adresą, kuris priima prenumeratos užklausas.
4. **Service worker registracija.** Kliento aplikacijoje (pvz., `main.tsx`) užregistruokite service workerą:

   ```ts
   if ("serviceWorker" in navigator) {
     navigator.serviceWorker.register("/firebase-messaging-sw.js");
   }
   ```

## Žetono gavimas su Firebase

`usePushSubscription` kabliukas sąmoningai neimportuoja Firebase bibliotekų, todėl galima naudoti tiek FCM, tiek kitus Web Push tiekėjus. Toliau pateiktas pavyzdys parodo, kaip apgaubti `getToken` funkciją iš `firebase/messaging` ir perduoti ją kabliukui. Po sėkmingos registracijos `subscriptionId` lauke rasite identifikatorių, reikalingą `DELETE` užklausoms:

```ts
import { useEffect } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { initializeApp } from "firebase/app";
import usePushSubscription from "../features/notifications/usePushSubscription";

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
});

const messaging = getMessaging(firebaseApp);

export const BrowserPushSetup = () => {
  const { register, revoke, status, error, isRegistered, subscriptionId } = usePushSubscription();

  useEffect(() => {
    const enablePush = async () => {
      const tokenResponse = await register({
        getToken: async () =>
          getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.ready
          }),
        metadata: {
          sdk: "firebase",
          locale: navigator.language
        }
      });

      console.debug("Prenumerata užregistruota", {
        subscriptionId,
        token: tokenResponse
      });
    };

    enablePush().catch((reason) => {
      console.error("Nepavyko aktyvuoti pranešimų", reason);
    });

    return () => {
      if (!isRegistered) {
        return;
      }

      revoke().catch((reason) => {
        console.error("Nepavyko atšaukti prenumeratos", reason);
      });
    };
  }, [isRegistered, register, revoke]);

  return (
    <div>
      <p>Būsenos kodas: {status}</p>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
};
```

Kabliukas pats pasirūpina `Notification.requestPermission()` kvietimu (jei API pasiekiama) ir automatiškai pažymi prenumeraciją kaip `success`, kai backendas patvirtina žetoną. Jei naršyklė nesupranta `Notification` API (pvz., senesnėse iOS versijose), `permission` bus `"unsupported"`, tačiau registracija vis tiek vyks tol, kol pateikiamas žetonas.

## Prenumeratos atšaukimas

Kai vartotojas atsijungia arba išjungia pranešimus, kvieskite `revoke()` kabliuko metodą. Pagal nutylėjimą jis panaudos paskutinį sėkmingai išsaugotą `subscriptionId`, tačiau galima perduoti ir konkrečią reikšmę: `revoke(customId)`. Funkcija iškvies `DELETE /notifications/subscriptions/:id`, pašalins prenumeratą iš serverio ir išvalys lokalią būseną (`subscriptionId` ir `token`).

## Derinimas

- Įsitikinkite, kad backend API atsako su `201` arba `204` į `POST /notifications/subscriptions` ir grąžina `204` į `DELETE` užklausas.
- Naršyklėje patikrinkite `Application → Service Workers`, ar service worker aktyvus, ir `Application → Push Messaging`, ar prenumerata užregistruota.
- Jei `status` pereina į `error`, peržiūrėkite `error` tekstą (kabliukas persiunčia API klaidų žinutes) bei `console` logus, kad nustatytumėte priežastį.
