import {enableProdMode, ɵresetCompiledComponents} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// import { hmrBootstrap } from './hmr';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

// declare var module: any;
// if (module['hot']) {
//   module['hot'].accept();
//   module['hot'].dispose(() => ɵresetCompiledComponents());
// }

// if (environment.hmr) {
//   // @ts-ignore
//   if (module[ 'hot' ]) {
//     // @ts-ignore
//     hmrBootstrap(module, bootstrap);
//   } else {
//     console.error('HMR is not enabled for webpack-dev-server!');
//     console.log('Are you using the --hmr flag for ng serve?');
//   }
// } else {
//   bootstrap().catch(err => console.log(err));
// }
