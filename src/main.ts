import { InjectVersionPlugin } from './plugin';
import { ParameterType } from 'typedoc/dist/lib/utils';
import { Application } from 'typedoc';

export function load(app:Application) {
  app.options.addDeclaration({
    name: 'versionsMapping',
    type: ParameterType.Mixed,
    help: '',
  });

  app.converter.addComponent('inject-version', new InjectVersionPlugin(app.converter));
}
