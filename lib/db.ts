import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'BelgaumAIChatDB';
const STORE_NAME = 'messages';
const DB_VERSION = 1;

export interface ChatMessage {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export async function initDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('timestamp', 'timestamp');
            }
        },
    });
}

export async function saveMessage(message: ChatMessage) {
    const db = await initDB();
    return db.add(STORE_NAME, message);
}

export async function getMessages(): Promise<ChatMessage[]> {
    const db = await initDB();
    return db.getAllFromIndex(STORE_NAME, 'timestamp');
}

export async function clearOldMessages(minutes: number = 5) {
    const db = await initDB();
    const threshold = Date.now() - minutes * 60 * 1000;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const index = tx.store.index('timestamp');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(threshold));

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
}
