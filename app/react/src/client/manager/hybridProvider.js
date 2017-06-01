import qs from 'qs';
import React from 'react';
import { Provider } from '@storybook/ui';
import { WebsocketTransport } from '@storybook/channel-websocket';
import { PostmsgTransport } from '@storybook/channel-postmessage';
import Channel from '@storybook/channels';
import addons from '@storybook/addons';
import uuid from 'uuid';
import Preview from './preview';

export default class ReactHybridProvider extends Provider {
  constructor({ url: domain, options = {} }) {
    super();
    this.options = options;
    this.selection = null;

    const secured = options.secured;
    const websocketType = secured ? 'wss' : 'ws';

    let url = `${websocketType}://${domain}`;

    if (options.manualId) {
      const pairedId = uuid().substr(-6);
      this.pairedId = pairedId;
      url += `/pairedId=${this.pairedId}`;
    }

    this.channel = createMultiChannel(
      new WebsocketTransport({ url }),
      new PostmsgTransport({ page: 'manager' })
    );

    addons.setChannel(this.channel);
  }

  getPanels() {
    return addons.getPanels();
  }

  renderPreview(selectedKind, selectedStory) {
    const queryParams = {
      selectedKind,
      selectedStory,
    };

    // Add the react-perf query string to the iframe if that present.
    if (/react_perf/.test(location.search)) {
      queryParams.react_perf = '1';
    }

    const queryString = qs.stringify(queryParams);
    const url = `iframe.html?${queryString}`;
    return <Preview url={url} />;
  }

  handleAPI(api) {
    api.onStory((kind, story) => {
      this.channel.emit('setCurrentStory', { kind, story });
    });
    this.channel.on('setStories', data => {
      api.setStories(data.stories);
    });
    this.channel.on('selectStory', data => {
      api.selectStory(data.kind, data.story);
    });
    this.channel.on('applyShortcut', data => {
      api.handleShortcut(data.event);
    });
    addons.loadAddons(api);
  }
}

class MultiChannel {
  constructor(...channels) {
    this.channels = channels;
  }

  send(event) {
    this.channels.forEach(channel => channel.send(event));
  }

  setHandler(handler) {
    this.channels.forEach(channel => channel.setHandler(handler));
  }
}

function createMultiChannel(...channels) {
  const transport = new MultiChannel(...channels);
  return new Channel({ transport });
}
