import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #root {
              height: 100%;
              margin: 0;
              padding: 0;
              background-color: #0A1628;
            }
            #root {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            /* Constrain the Expo app to a mobile-width container */
            #root > div {
              width: 100%;
              max-width: 430px;
              flex: 1;
              position: relative;
              overflow: hidden;
            }
            /* Load @expo/vector-icons (Feather + MaterialIcons) icon fonts for web */
            @font-face {
              font-family: "Feather";
              src: url(https://cdn.jsdelivr.net/npm/@expo/vector-icons@14/build/vendor/react-native-vector-icons/Fonts/Feather.ttf) format("truetype");
              font-display: swap;
            }
            @font-face {
              font-family: "MaterialIcons";
              src: url(https://cdn.jsdelivr.net/npm/@expo/vector-icons@14/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf) format("truetype");
              font-display: swap;
            }
            @font-face {
              font-family: "MaterialCommunityIcons";
              src: url(https://cdn.jsdelivr.net/npm/@expo/vector-icons@14/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf) format("truetype");
              font-display: swap;
            }
            @font-face {
              font-family: "Ionicons";
              src: url(https://cdn.jsdelivr.net/npm/@expo/vector-icons@14/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf) format("truetype");
              font-display: swap;
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
