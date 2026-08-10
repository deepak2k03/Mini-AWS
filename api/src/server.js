import { app } from './app.js';
import { config } from './config.js';
import { connectDatabase } from './db.js';

await connectDatabase();
app.listen(config.PORT, () => console.log(`API listening on http://localhost:${config.PORT}`));

