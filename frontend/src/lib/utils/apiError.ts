interface ApiErrorResponse {
    response?: {
        data?: {
            message?: string;
            errors?: unknown;
        };
    };
    message?: string;
}

function isZodErrors(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null;
}

function extractErrorMessages(obj: unknown, messages: Set<string>): void {
    if (!isZodErrors(obj)) return;

    for (const key in obj) {
        const value = obj[key];

        if (key === '_errors' && Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'string') {
                    messages.add(item);
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            extractErrorMessages(value, messages);
        }
    }
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
    if (err === null || err === undefined) return fallback;
    const apiErr = err as ApiErrorResponse;

    const message = apiErr?.response?.data?.message || apiErr?.message || fallback;

    const errors = apiErr.response?.data?.errors;
    if (Array.isArray(errors)) {
        const details = errors
            .map((item: unknown) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null && 'message' in item) {
                    const entry = item as { field?: unknown; message: unknown };
                    if (typeof entry.message !== 'string') return null;
                    return typeof entry.field === 'string' && entry.field !== ''
                        ? `${entry.field}: ${entry.message}`
                        : entry.message;
                }
                return null;
            })
            .filter((text): text is string => text !== null);
        if (details.length > 0) {
            return `${message}: ${details.join('; ')}`;
        }
        return message;
    }
    if (errors && !Array.isArray(errors)) {
        const messages = new Set<string>();
        extractErrorMessages(errors, messages);

        if (messages.size > 0) {
            const details = Array.from(messages).join('; ');
            return `${message}: ${details}`;
        }
    }

    return message;
}
