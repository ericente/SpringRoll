import { Bellhop } from 'bellhop-iframe';
import { Debugger } from './debug/Debugger.js';
import { StateManager } from './state/StateManager.js';

/**
 * Main entry point for a game. Provides a single focal point for plugins and functionality to attach.
 * @class Application
 */
export class Application {
  /**
   * Creates a new application, setting up plugins along the way.
   * @param {Object} features A configuration object denoting which features are enabled for this application
   * @param {Boolean} features.captions A boolean value denoting that this game supports captions
   * @param {Boolean} features.sound A boolean value denoting that this game has some audio in it
   * @param {Boolean} features.vo A boolean denoting that this game has mutable voice-over audio in it
   * @param {Boolean} features.music A boolean denoting that this game has mutable music in it
   * @param {Boolean} features.sfx A boolean denoting that this game has mutable sound effects in it
   */
  constructor(features) {
    /**
     * @member {StateManager} The state manager for this application instance. Maintains subscribable properties for
     *                        whether or not audio is muted, captions are displayed, or the game is paused.
     */
    this.state = new StateManager();
    this.state.addField('ready', false);
    this.state.addField('soundMuted', false);
    this.state.addField('captionsMuted', true);
    this.state.addField('musicMuted', false);
    this.state.addField('voMuted', false);
    this.state.addField('sfxMuted', false);
    this.state.addField('pause', false);
    this.state.addField('playOptions', {});

    this.features = Object.assign(
      {
        captions: false,
        sound: false,
        vo: false,
        music: false,
        sfx: false
      },
      features || {}
    );

    // always enable sound if one of the sound channels is enabled
    if (this.features.vo || this.features.music || this.features.sfx) {
      this.features.sound = true;
    }

    // create the connection to the container (if possible), and report features and SpringRoll 1 compat data
    this.container = new Bellhop();
    this.container.connect();
    this.container.send('features', this.features);
    this.container.send('keepFocus', false);

    // listen for events from the container and keep the local value in sync
    [
      'soundMuted',
      'captionsMuted',
      'musicMuted',
      'voMuted',
      'sfxMuted',
      'pause'
    ].forEach(eventName => {
      const property = this.state[eventName];
      this.container.on(
        eventName,
        containerEvent => (property.value = containerEvent.data)
      );
    });

    // maintain focus sync between the container and application
    window.addEventListener('focus', () => this.container.send('focus', true));
    window.addEventListener('blur', () => this.container.send('focus', false));

    // attempt to fetch play options from the query string (passed by the Container)
    const match = /playOptions=[^&$]*/.exec(window.location.search);
    if (match !== null) {
      const matchedToken = match[0];
      const rawValue = decodeURIComponent(matchedToken.split('=')[1]);

      try {
        this.playOptions = JSON.parse(rawValue);
      } catch (e) {
        Debugger.log(
          'warn',
          'Failed to parse playOptions from query string:' + e.message
        );
      }
    }

    // Also attempt to fetch over the iframe barrier for old container support
    this.container.fetch('playOptions', e => (this.playOptions.value = e.data));

    Application._plugins.forEach(plugin => plugin.setup(this));

    const preloads = Application._plugins.map(plugin => plugin.preload(this));

    Promise.all(preloads)
      .catch(e => {
        console.warn(e);
      })
      .then(() => {
        this.validateListeners();
      })
      .catch(e => {
        console.warn(e);
      })
      .then(() => {
        this.container.send('loaded');
        this.state.ready.value = true;
      });
  }

  /**
   * Validates that appropriate listeners are added for the features that were enabled in the constructor
   * @throws Error
   */
  validateListeners() {
    const missingListeners = [];

    const featureToStateMap = {
      captions: 'captionsMuted',
      sound: 'soundMuted',
      music: 'musicMuted',
      vo: 'voMuted',
      sfx: 'sfxMuted'
    };

    Object.keys(featureToStateMap).forEach(feature => {
      const stateName = featureToStateMap[feature];

      if (this.features[feature] && !this.state[stateName].hasListeners) {
        missingListeners.push(stateName);
      }
    });

    if (!this.state.pause.hasListeners) {
      missingListeners.push('pause');
    }

    if (missingListeners.length) {
      throw new Error(
        'Application state is missing required listeners: ' +
          missingListeners.join(', ') +
          '.'
      );
    }
  }
}

/**
 * The list of plugins that are currently registered to run on Applications.
 * @static
 */
Application._plugins = [];

/**
 * @typedef {typeof import('./plugins/ApplicationPlugin.js').ApplicationPlugin} ApplicationPlugin
 */

/**
 * Registers a plugin to be used by applications, sorting it by priority order.
 * @param {ApplicationPlugin} plugin The plugin to register.
 */
Application.uses = function(plugin) {
  Application._plugins.push(plugin);
  Application._plugins.sort((p1, p2) => p2.priority - p1.priority);
};
