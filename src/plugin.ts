import * as fs from 'fs/promises';
import * as path from 'path';
import mapWorkspaces from '@npmcli/map-workspaces';
import { Component } from 'typedoc/dist/lib/utils/component';
import { ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Context } from 'typedoc/dist/lib/converter/context';
import { BindOption, Converter, DeclarationReflection, ReflectionKind } from 'typedoc';

@Component({ name: 'inject-version' })
export class InjectVersionPlugin extends ConverterComponent {
  /**
   * regexp to packageName mapping
   * @type {Record<string, string> | string}
   */
  @BindOption('versionsMapping')
  versionsMapping!:Record<string, string> | string;

  public initialize():void {
    this.listenTo(this.owner, Converter.EVENT_RESOLVE_END, this.onEndResolve);
  }

  private async onEndResolve(context:Context):Promise<void> {
    const { packageInfo } = context.project;

    if (!packageInfo) return;
    const { name, version } = packageInfo;

    const foundVersions:Record<string, string> = { [name]: version };
    let directory = context.project.directory;
    while (directory.parent) directory = directory.parent;

    const workspaces = await mapWorkspaces({
      cwd: directory.dirName! || process.cwd(),
      pkg: packageInfo,
    });

    for (const [name, workspace] of workspaces.entries()) {
      const file = await fs.readFile(path.resolve(workspace, 'package.json'), 'utf8');
      const { version } = JSON.parse(file);
      if (!foundVersions[name]) {
        foundVersions[name] = version;
      }
    }

    const mapping:Map<RegExp, string> = new Map();
    // TODO: add reasonable defaults
    const versionsMapping = typeof this.versionsMapping === 'string'
      ? { [this.versionsMapping || '__version__']: name }
      : this.versionsMapping;

    for (const [pattern, replacement] of Object.entries(versionsMapping)) {
      try {
        mapping.set(new RegExp(pattern), replacement);
      } catch {
        this.application.logger.error(`Failed to parse link pattern ${pattern}.`);
      }
    }

    context.project.getReflectionsByKind(ReflectionKind.Variable).forEach(reflection => {
      mapping.forEach((replacement, reg) => {
        const { defaultValue } = reflection as DeclarationReflection;
        if (!defaultValue) return;
        const char = defaultValue.charAt(0);
        const pkg = defaultValue.substr(1, defaultValue.length - 2).replace(reg, replacement);
        (reflection as DeclarationReflection).defaultValue = `${char}${foundVersions[pkg]}${char}`;
      });
    });
  }
}
