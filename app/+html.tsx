import { ScrollViewStyleReset } from 'expo-router/html';
<<<<<<< HEAD
=======
import type { ReactNode } from 'react';
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
<<<<<<< HEAD
export default function Root({ children }: { children: React.ReactNode }) {
=======
export default function Root({ children }: { children: ReactNode }) {
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

<<<<<<< HEAD
        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
=======
        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
