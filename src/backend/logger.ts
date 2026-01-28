import { env } from '@/shared/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  environment: string;
}

class Logger {
  private format(level: LogLevel, message: string, context?: Record<string, any>, userId?: string): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId,
      environment: env.NODE_ENV,
    };
  }

  private print(entry: LogEntry) {
    if (env.NODE_ENV === 'production') {
      // Em produção, sempre JSON estruturado para ingestão (DataDog, CloudWatch, etc)
      console.log(JSON.stringify(entry));
    } else {
      // Em dev, formato mais legível
      const color = entry.level === 'error' ? '\x1b[31m' : entry.level === 'warn' ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      console.log(`${color}[${entry.timestamp}] ${entry.level.toUpperCase()}:${reset} ${entry.message}`, entry.context || '', entry.userId ? `(User: ${entry.userId})` : '');
    }
  }

  info(message: string, context?: Record<string, any>, userId?: string) {
    this.print(this.format('info', message, context, userId));
  }

  warn(message: string, context?: Record<string, any>, userId?: string) {
    this.print(this.format('warn', message, context, userId));
  }

  error(message: string, error?: any, context?: Record<string, any>, userId?: string) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: env.NODE_ENV === 'development' ? error.stack : undefined // Não vazar stack em prod no JSON log se não for seguro, mas geralmente logs de servidor podem ter stack. O importante é não vazar para o cliente HTTP.
    } : error;

    this.print(this.format('error', message, { ...context, error: errorDetails }, userId));
  }
}

export const logger = new Logger();
