

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
	[key: string]: unknown;
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	error?: Error;
}

function formatLogEntry(entry: LogEntry): string {
	const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;

	if (entry.context && Object.keys(entry.context).length > 0) {
		return `${base} ${JSON.stringify(entry.context)}`;
	}

	return base;
}

function getTimestamp(): string {
	return new Date().toISOString();
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
	const entry: LogEntry = {
		timestamp: getTimestamp(),
		level,
		message,
		context,
		error
	};

	const formatted = formatLogEntry(entry);

	switch (level) {
		case 'debug':
			if (process.env.NODE_ENV !== 'production') {
				console.debug(formatted);
			}
			break;
		case 'info':
			console.info(formatted);
			break;
		case 'warn':
			console.warn(formatted);
			break;
		case 'error':
			console.error(formatted);
			if (error?.stack) {
				console.error(error.stack);
			}
			break;
	}
}

export const logger = {

	debug: (message: string, context?: LogContext) => {
		log('debug', message, context);
	},


	info: (message: string, context?: LogContext) => {
		log('info', message, context);
	},


	warn: (message: string, context?: LogContext) => {
		log('warn', message, context);
	},


	error: (message: string, error?: Error, context?: LogContext) => {
		log('error', message, context, error);
	},


	child: (defaultContext: LogContext) => ({
		debug: (message: string, context?: LogContext) => {
			log('debug', message, { ...defaultContext, ...context });
		},
		info: (message: string, context?: LogContext) => {
			log('info', message, { ...defaultContext, ...context });
		},
		warn: (message: string, context?: LogContext) => {
			log('warn', message, { ...defaultContext, ...context });
		},
		error: (message: string, error?: Error, context?: LogContext) => {
			log('error', message, { ...defaultContext, ...context }, error);
		}
	})
};

export interface RequestContext {
	method: string;
	path: string;
	requestId: string;
	userAgent?: string;
	ip?: string;
}

export function createRequestLogger(context: RequestContext) {
	return logger.child({
		requestId: context.requestId,
		method: context.method,
		path: context.path,
		userAgent: context.userAgent,
		ip: context.ip
	});
}
