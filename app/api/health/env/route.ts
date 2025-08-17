/**
 * 环境变量健康检查API端点
 * GET /api/health/env - 检查环境变量配置状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, getServiceStatus, getEnvConfigStatus } from '../../../../lib/env-init';
import { ApiResponseBuilder } from '../../../../lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // 执行健康检查
    const health = healthCheck();
    
    // 获取详细状态
    const serviceStatus = getServiceStatus();
    const configStatus = getEnvConfigStatus();
    
    // 构建响应数据
    const responseData = {
      ...health,
      details: {
        services: serviceStatus,
        configuration: {
          environment: configStatus.environment,
          summary: configStatus.summary,
          // 在生产环境下隐藏详细配置信息
          variables: process.env.NODE_ENV === 'production' ? undefined : configStatus.configStatus
        }
      }
    };
    
    // 根据健康状态返回相应的响应
    if (health.status === 'healthy') {
      return ApiResponseBuilder.success(responseData, '环境配置检查完成');
    } else {
      return ApiResponseBuilder.serverError('环境配置异常', 'ENV_CONFIG_ERROR');
    }
    
  } catch (error) {
    console.error('Environment health check failed:', error);
    
    return ApiResponseBuilder.serverError(
      '环境配置检查失败',
      'ENV_CHECK_FAILED',
      process.env.NODE_ENV === 'development' ? (error as Error).message : '环境配置检查失败'
    );
  }
}

// 仅允许GET请求
export async function POST() {
  return ApiResponseBuilder.clientError('Method not allowed', 'METHOD_NOT_ALLOWED', undefined, 405);
}

export async function PUT() {
  return ApiResponseBuilder.clientError('Method not allowed', 'METHOD_NOT_ALLOWED', undefined, 405);
}

export async function DELETE() {
  return ApiResponseBuilder.clientError('Method not allowed', 'METHOD_NOT_ALLOWED', undefined, 405);
}