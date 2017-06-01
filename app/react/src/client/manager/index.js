/* global document */

import renderStorybookUI from '@storybook/ui';
import Provider from './provider';
import HybridProvider from './hybridProvider';

const rootEl = document.getElementById('root');
renderStorybookUI(rootEl, new HybridProvider({ url: location.host, options: window.storybookOptions }));
