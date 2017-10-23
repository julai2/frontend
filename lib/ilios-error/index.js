/* eslint-env node */
'use strict';

module.exports = {
  name: 'ilios-error',

  contentFor: function (type, config) {
    if (type === 'head') {
      return `
        <style type="text/css">
          #ilios-loading-error {
            padding: 2em;
            text-align: center;
          }
        </style>
      `;
    }
    if (type === 'body-footer') {
      return `<script src="${config.rootURL}ilios-error/scripts.js"></script>`;
    }

    if( type === 'body') {
      return `
        <h1 id='ilios-loading-error' class='hidden ember-load-indicator'>
          It is possible that your browser is not supported by Ilios.
          Please refresh this page or try a different browser.
        </h1>
      `;
    }
  }
};