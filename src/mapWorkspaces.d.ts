declare module '@npmcli/map-workspaces' {
  type Options = {
    cwd:string;
    pkg:any;
    ignore?:string[];
  }

  function mapWorkspaces(opts:Options):Promise<Map<string, string>>;

  export default mapWorkspaces;
}

