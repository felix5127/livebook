import { NextRequest } from 'next/server';

/**
 * 速率限制器
 * 支持基于内存的滑动窗口算法，适用于无服务器环境
 */

// 速率限制配置类型
export interface RateLimitRule {
  max: number;      // 最大请求数
  window: number;   // 时间窗口（秒）
  burst?: number;   // 突发请求数（可选）
}

// 认证方法类型
export type AuthMethod = 'JWT' | 'API_KEY' | 'anonymous';

// 速率限制配置
export const RATE_LIMIT_CONFIG: Record<string, Record<AuthMethod, RateLimitRule>> = {
  // 转写API - 严格限制（资源密集型）
  '/api/transcribe': {
    'JWT': { max: 10, window: 3600, burst: 2 },       // JWT用户：10次/小时，突发2次
    'API_KEY': { max: 50, window: 3600, burst: 5 },   // API Key：50次/小时，突发5次
    'anonymous': { max: 2, window: 3600, burst: 1 }    // 匿名：2次/小时，突发1次
  },
  
  // AI聊天API - 中等限制
  '/api/ai/chat': {
    'JWT': { max: 100, window: 3600, burst: 10 },
    'API_KEY': { max: 200, window: 3600, burst: 20 },
    'anonymous': { max: 10, window: 3600, burst: 2 }
  },
  
  // AI总结/翻译API - 中等限制
  '/api/ai/summary': {
    'JWT': { max: 50, window: 3600, burst: 5 },
    'API_KEY': { max: 100, window: 3600, burst: 10 },
    'anonymous': { max: 5, window: 3600, burst: 1 }
  },
  
  '/api/ai/translate': {
    'JWT': { max: 50, window: 3600, burst: 5 },
    'API_KEY': { max: 100, window: 3600, burst: 10 },
    'anonymous': { max: 5, window: 3600, burst: 1 }
  },
  
  // 任务查询API - 宽松限制
  '/api/tasks/': {
    'JWT': { max: 1000, window: 3600, burst: 50 },
    'API_KEY': { max: 2000, window: 3600, burst: 100 },
    'anonymous': { max: 100, window: 3600, burst: 10 }
  },
  
  // 文件上传API - 中等限制
  '/api/upload': {
    'JWT': { max: 20, window: 3600, burst: 3 },
    'API_KEY': { max: 50, window: 3600, burst: 5 },
    'anonymous': { max: 5, window: 3600, burst: 1 }
  },
  
  // 默认规则（其他API）
  'default': {
    'JWT': { max: 200, window: 3600, burst: 20 },
    'API_KEY': { max: 500, window: 3600, burst: 50 },
    'anonymous': { max: 50, window: 3600, burst: 5 }
  }
};

// 内存存储（适用于单实例，生产环境建议使用Redis）
interface RequestRecord {
  count: number;
  windowStart: number;
  burstCount: number;
  lastRequest: number;
}

class MemoryRateLimiter {
  private store = new Map<string, RequestRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每5分钟清理过期记录
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 检查是否超过速率限制
   */
  async isAllowed(
    identifier: string,
    rule: RateLimitRule
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const now = Date.now();
    const windowMs = rule.window * 1000;
    const burstWindow = 60 * 1000; // 突发窗口：1分钟

    let record = this.store.get(identifier);
    
    // 初始化记录
    if (!record) {
      record = {
        count: 0,
        windowStart: now,
        burstCount: 0,
        lastRequest: 0
      };
    }

    // 检查是否需要重置窗口
    if (now - record.windowStart >= windowMs) {
      record.count = 0;
      record.windowStart = now;
    }

    // 检查突发限制（如果配置了）
    if (rule.burst && now - record.lastRequest < burstWindow) {
      if (record.burstCount >= rule.burst) {
        const retryAfter = Math.ceil((burstWindow - (now - record.lastRequest)) / 1000);
        return {
          allowed: false,
          remaining: Math.max(0, rule.max - record.count),
          resetTime: record.windowStart + windowMs,
          retryAfter
        };
      }
    } else {
      // 重置突发计数
      record.burstCount = 0;
    }

    // 检查主要限制
    if (record.count >= rule.max) {
      const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.windowStart + windowMs,
        retryAfter
      };
    }

    // 允许请求，更新计数
    record.count++;
    record.burstCount++;
    record.lastRequest = now;
    
    this.store.set(identifier, record);

    return {
      allowed: true,
      remaining: Math.max(0, rule.max - record.count),
      resetTime: record.windowStart + windowMs
    };
  }

  /**
   * 清理过期记录
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2小时

    for (const [key, record] of Array.from(this.store.entries())) {
      if (now - record.windowStart > maxAge) {
        this.store.delete(key);
      }
    }

    console.log(`[RateLimit] 清理完成，当前记录数: ${this.store.size}`);
  }

  /**
   * 获取统计信息
   */
  getStats(): { totalKeys: number; memoryUsage: string } {
    const memoryUsage = JSON.stringify(Array.from(this.store.entries())).length;
    return {
      totalKeys: this.store.size,
      memoryUsage: `${Math.round(memoryUsage / 1024)} KB`
    };
  }

  /**
   * 清理所有记录（用于测试）
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// 全局实例
const rateLimiter = new MemoryRateLimiter();

/**
 * 获取速率限制规则
 */
export function getRateLimitRule(path: string, authMethod: AuthMethod): RateLimitRule {
  // 精确匹配
  if (RATE_LIMIT_CONFIG[path]?.[authMethod]) {
    return RATE_LIMIT_CONFIG[path][authMethod];
  }

  // 前缀匹配
  for (const pattern in RATE_LIMIT_CONFIG) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      const rule = RATE_LIMIT_CONFIG[pattern]?.[authMethod];
      if (rule) return rule;
    }
  }

  // 使用默认规则
  return RATE_LIMIT_CONFIG.default[authMethod];
}

/**
 * 生成速率限制标识符
 */
export function generateRateLimitIdentifier(
  request: NextRequest,
  authMethod: AuthMethod,
  userId?: string
): string {
  const path = request.nextUrl.pathname;
  
  // 优先使用用户ID
  if (userId && userId !== 'anonymous') {
    return `user:${userId}:${path}`;
  }

  // 使用认证方法 + IP
  const ip = getClientIP(request);
  return `${authMethod}:${ip}:${path}`;
}

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string {
  // Vercel环境
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // 其他反向代理
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 直连（本地开发）
  const remoteAddr = request.headers.get('x-vercel-forwarded-for') || 
                    request.headers.get('cf-connecting-ip') ||
                    '127.0.0.1';
  
  return remoteAddr;
}

/**
 * 检查速率限制
 */
export async function checkRateLimit(
  request: NextRequest,
  authMethod: AuthMethod,
  userId?: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  rule: RateLimitRule;
}> {
  const path = request.nextUrl.pathname;
  const identifier = generateRateLimitIdentifier(request, authMethod, userId);
  const rule = getRateLimitRule(path, authMethod);

  const result = await rateLimiter.isAllowed(identifier, rule);

  // 记录日志
  if (!result.allowed) {
    console.warn(`[RateLimit] 请求被限制: ${identifier}, 规则: ${JSON.stringify(rule)}`);
  }

  return {
    ...result,
    rule
  };
}

/**
 * 获取速率限制器统计信息
 */
export function getRateLimiterStats() {
  return rateLimiter.getStats();
}

/**
 * 清理速率限制器（用于测试）
 */
export function clearRateLimiter() {
  rateLimiter.clear();
}

export default rateLimiter;