import { app } from './app.js';
import { config } from './config.js';
import { connectDatabase } from './db.js';

import { setupTerminal } from './terminal.js';

await connectDatabase();
const server = app.listen(config.PORT, () => console.log(`API listening on http://localhost:${config.PORT}`));
setupTerminal(server);

