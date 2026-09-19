{ pkgs, lib, config, inputs, ... }:

{
  languages = {
    javascript = {
      enable = true;
      package = pkgs.nodejs_26;
      npm.enable = true;
      pnpm = {
        enable = true;
        install.enable = true;
      };
    };
  };
}
