import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
<<<<<<< HEAD
import React from 'react';
import { Platform } from 'react-native';

export function ExternalLink(
  props: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }
) {
=======
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

export function ExternalLink(props: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e
  return (
    <Link
      target="_blank"
      {...props}
<<<<<<< HEAD
      // @ts-expect-error: External URLs are not typed.
=======
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e
      href={props.href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          e.preventDefault();
          // Open the link in an in-app browser.
          WebBrowser.openBrowserAsync(props.href as string);
        }
      }}
    />
  );
}
