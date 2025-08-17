import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import CryptoJS from 'crypto-js';
import { getEnv, validateServiceConfig } from './env-init';

// JWT相关类型定义
export interface JWTUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface JWTTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  name?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT工具类
 */
export class JWTManager {
  private static readonly algorithm = 'HS256';
  private static readonly defaultExpiration = '24h'; // 24小时过期

  /**
   * 生成JWT Token
   */
  static async generateToken(user: JWTUser, expiresIn: string = this.defaultExpiration): Promise<string> {
    const secret = this.getJWTSecret();
    const secretKey = new TextEncoder().encode(secret);

    // 计算过期时间
    const expirationTime = this.parseExpiration(expiresIn);

    return await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    })
      .setProtectedHeader({ alg: this.algorithm })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .setIssuer('livebook-mvp')
      .setAudience('livebook-api')
      .sign(secretKey);
  }

  /**
   * 验证JWT Token
   */
  static async verifyToken(token: string): Promise<JWTTokenPayload> {
    const secret = this.getJWTSecret();
    const secretKey = new TextEncoder().encode(secret);

    try {
      const { payload } = await jwtVerify(token, secretKey, {
        issuer: 'livebook-mvp',
        audience: 'livebook-api'
      });

      return payload as JWTTokenPayload;
    } catch (error: any) {
      throw new Error(`Token验证失败: ${error.message}`);
    }
  }

  /**
   * 刷新Token
   */
  static async refreshToken(token: string): Promise<string> {
    try {
      const payload = await this.verifyToken(token);
      
      // 检查Token是否在刷新窗口内
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = (payload.exp || 0) - now;
      
      // 如果Token还有超过6小时才过期，不需要刷新
      if (timeUntilExpiry > 6 * 60 * 60) {
        return token;
      }

      // 生成新Token
      const user: JWTUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name
      };

      return await this.generateToken(user);
    } catch (error: any) {
      throw new Error(`Token刷新失败: ${error.message}`);
    }
  }

  /**
   * 获取JWT密钥
   */
  private static getJWTSecret(): string {
    try {
      const env = getEnv();
      if (!env.JWT_SECRET) {
        throw new Error('JWT_SECRET环境变量未配置');
      }
      return env.JWT_SECRET;
    } catch (error) {
      throw new Error('无法获取JWT密钥：环境变量验证失败');
    }
  }

  /**
   * 解析过期时间字符串
   */
  private static parseExpiration(expiresIn: string): number {
    const now = Math.floor(Date.now() / 1000);
    
    // 解析时间单位
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('无效的过期时间格式，支持: 30s, 15m, 24h, 7d');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    let seconds: number;
    switch (unit) {
      case 's': seconds = value; break;
      case 'm': seconds = value * 60; break;
      case 'h': seconds = value * 60 * 60; break;
      case 'd': seconds = value * 24 * 60 * 60; break;
      default: throw new Error('不支持的时间单位');
    }

    return now + seconds;
  }
}

/**
 * API Key管理工具
 */
export class APIKeyManager {
  /**
   * 生成API Key
   */
  static generateAPIKey(prefix: string = 'lbk'): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const hash = CryptoJS.SHA256(timestamp + random).toString();
    
    return `${prefix}_${hash.substring(0, 32)}`;
  }

  /**
   * 验证API Key格式
   */
  static validateAPIKeyFormat(apiKey: string): boolean {
    const pattern = /^[a-z]{2,10}_[a-f0-9]{32}$/;
    return pattern.test(apiKey);
  }

  /**
   * 检查API Key是否有效
   */
  static isValidAPIKey(apiKey: string): boolean {
    if (!this.validateAPIKeyFormat(apiKey)) {
      return false;
    }

    const validApiKeys = this.getValidAPIKeys();
    return validApiKeys.includes(apiKey);
  }

  /**
   * 获取所有有效的API Keys
   */
  static getValidAPIKeys(): string[] {
    try {
      const env = getEnv();
      const keys = env.VALID_API_KEYS || '';
      return keys.split(',').filter(Boolean).map(key => key.trim());
    } catch (error) {
      console.warn('无法获取有效API Keys：环境变量验证失败');
      return [];
    }
  }

  /**
   * 创建API Key哈希（用于存储）
   */
  static hashAPIKey(apiKey: string): string {
    return CryptoJS.SHA256(apiKey).toString();
  }
}

/**
 * 认证工具函数
 */
export class AuthUtils {
  /**
   * 从请求头提取认证信息
   */
  static extractAuthFromHeaders(headers: Headers): {
    bearerToken?: string;
    apiKey?: string;
  } {
    const authorization = headers.get('authorization');
    const apiKey = headers.get('x-api-key');

    return {
      bearerToken: authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined,
      apiKey: apiKey || undefined
    };
  }

  /**
   * 创建认证错误响应
   */
  static createAuthErrorResponse(message: string, code: string = 'AUTH_ERROR') {
    return {
      success: false,
      error: '认证失败',
      message,
      code,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 检查用户权限
   */
  static hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = ['guest', 'user', 'admin', 'super_admin'];
    const userLevel = roleHierarchy.indexOf(userRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    return userLevel >= requiredLevel;
  }

  /**
   * 生成安全的随机字符串
   */
  static generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

/**
 * 认证中间件辅助函数
 */
export class AuthMiddlewareHelpers {
  /**
   * 检查路径是否需要认证
   */
  static isProtectedPath(pathname: string): boolean {
    const protectedPaths = [
      '/api/transcribe',
      '/api/ai/',
      '/api/tasks/'
    ];

    return protectedPaths.some(path => pathname.startsWith(path));
  }

  /**
   * 检查是否为开发环境绕过路径
   */
  static isBypassPath(pathname: string): boolean {
    const bypassPaths = [
      '/api/test',
      '/api/health',
      '/api/status'
    ];

    return bypassPaths.some(path => pathname.startsWith(path));
  }

  /**
   * 获取认证配置
   */
  static getAuthConfig() {
    return {
      jwtSecret: process.env.JWT_SECRET,
      validApiKeys: APIKeyManager.getValidAPIKeys(),
      skipAuthInDev: process.env.SKIP_API_AUTH === 'true',
      isDevelopment: process.env.NODE_ENV === 'development'
    };
  }
}

// 导出常用的认证错误代码
export const AUTH_ERRORS = {
  MISSING_AUTH: 'MISSING_AUTH',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  INVALID_API_KEY: 'INVALID_API_KEY',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  AUTH_SERVICE_ERROR: 'AUTH_SERVICE_ERROR'
} as const;