import fs from 'fs';
import path from 'path';

const wranglerPath = path.join(process.cwd(), 'dist', 'server', 'wrangler.json');

if (fs.existsSync(wranglerPath)) {
  const config = JSON.parse(fs.readFileSync(wranglerPath, 'utf-8'));
  
  // Remove problematic fields for Pages
  delete config.triggers;
  delete config.assets;
  delete config.main;
  delete config.rules;
  delete config.no_bundle;
  
  // Remove Pages-incompatible fields
  delete config.definedEnvironments;
  delete config.ai_search_namespaces;
  delete config.ai_search;
  delete config.secrets_store_secrets;
  delete config.unsafe_hello_world;
  delete config.worker_loaders;
  delete config.ratelimits;
  delete config.vpc_services;
  delete config.vpc_networks;
  delete config.python_modules;
  
  // Clean up dev field
  if (config.dev) {
    delete config.dev.enable_containers;
    delete config.dev.generate_types;
  }
  
  fs.writeFileSync(wranglerPath, JSON.stringify(config, null, 2));
  console.log('✓ Fixed wrangler.json for Pages compatibility');
} else {
  console.log('wrangler.json not found, skipping fix');
}
