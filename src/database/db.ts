import mongoose from 'mongoose';
import dns from 'dns';

// Node's own (c-ares based) DNS resolver can fail "querySrv ECONNREFUSED" on
// mongodb+srv:// URIs even when the OS resolver handles the same SRV lookup
// fine — a known Node-on-Windows quirk. Pointing it at a public resolver
// works around it without needing a non-SRV connection string.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const createConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  try {
    return await mongoose.connect(process.env.MONGOOSE_URI as string);
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};
