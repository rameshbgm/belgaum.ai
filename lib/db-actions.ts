"use server";

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Instantiate Prisma
const prisma = new PrismaClient();

// Ensure logs directory exists
const LOGS_DIR = path.join(process.cwd(), 'chat_history_logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Stores a chat interaction in MySQL using Prisma and saves to a .txt file.
 */
export async function auditChatInteraction(sessionId: string, userRequest: string, botResponse: string) {
    try {
        // 1. Database Audit via Prisma
        const audit = await prisma.chatAudit.create({
            data: {
                sessionId,
                userRequest,
                botResponse,
            },
        });

        // 2. File Audit (.txt)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${sessionId}_${timestamp}.txt`;
        const filePath = path.join(LOGS_DIR, fileName);

        const fileContent = `
Session ID: ${sessionId}
Date Time: ${new Date().toLocaleString()}
------------------------------------------
USER REQUEST:
${userRequest}

------------------------------------------
BOT RESPONSE:
${botResponse}
------------------------------------------
`.trim();

        await fs.promises.writeFile(filePath, fileContent);

        return { success: true, id: audit.id, file: fileName };
    } catch (error) {
        console.error('Audit Orchestration Error:', error);
        return { success: false, error: String(error) };
    }
}
