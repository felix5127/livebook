import { NextRequest, NextResponse } from 'next/server';
import { APIKeyManager, AuthUtils } from '@/lib/auth';

/**
 * 生成新的API Key
 * POST /api/auth/apikey
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey, description } = body;

    // 验证管理员权限
    const adminApiKey = process.env.ADMIN_API_KEY;
    if (!adminApiKey || adminKey !== adminApiKey) {
      return NextResponse.json(
        AuthUtils.createAuthErrorResponse('需要管理员权限', 'ADMIN_REQUIRED'),
        { status: 403 }
      );
    }

    // 生成新的API Key
    const newApiKey = APIKeyManager.generateAPIKey('lbk');
    const hashedKey = APIKeyManager.hashAPIKey(newApiKey);

    // 实际项目中应该保存到数据库
    console.log(`[API Key] 新生成的API Key: ${newApiKey}`);
    console.log(`[API Key] 哈希值: ${hashedKey}`);
    console.log(`[API Key] 描述: ${description || '无描述'}`);

    return NextResponse.json({
      success: true,
      data: {
        apiKey: newApiKey,
        description: description || '',
        createdAt: new Date().toISOString(),
        format: 'lbk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        usage: '在请求头中添加: X-API-Key: ' + newApiKey
      },
      warning: '请妥善保存此API Key，系统不会再次显示完整密钥'
    });

  } catch (error: any) {
    console.error('[API Key] 生成API Key失败:', error);

    return NextResponse.json(
      AuthUtils.createAuthErrorResponse('API Key生成失败', 'APIKEY_GENERATION_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * 验证API Key
 * GET /api/auth/apikey
 */
export async function GET(request: NextRequest) {
  try {
    const { apiKey } = AuthUtils.extractAuthFromHeaders(request.headers);

    if (!apiKey) {
      return NextResponse.json(
        AuthUtils.createAuthErrorResponse('缺少API Key', 'MISSING_API_KEY'),
        { status: 401 }
      );
    }

    // 验证API Key格式
    if (!APIKeyManager.validateAPIKeyFormat(apiKey)) {
      return NextResponse.json(
        AuthUtils.createAuthErrorResponse('API Key格式无效', 'INVALID_APIKEY_FORMAT'),
        { status: 400 }
      );
    }

    // 验证API Key有效性
    const isValid = APIKeyManager.isValidAPIKey(apiKey);

    if (!isValid) {
      return NextResponse.json(
        AuthUtils.createAuthErrorResponse('API Key无效', 'INVALID_API_KEY'),
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        keyPrefix: apiKey.substring(0, 7) + '***',
        format: 'lbk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        validatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[API Key] 验证API Key失败:', error);

    return NextResponse.json(
      AuthUtils.createAuthErrorResponse('API Key验证失败', 'APIKEY_VALIDATION_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * 列出API Key（仅显示前缀）
 * 需要管理员权限
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey } = body;

    // 验证管理员权限
    const adminApiKey = process.env.ADMIN_API_KEY;
    if (!adminApiKey || adminKey !== adminApiKey) {
      return NextResponse.json(
        AuthUtils.createAuthErrorResponse('需要管理员权限', 'ADMIN_REQUIRED'),
        { status: 403 }
      );
    }

    // 获取所有有效的API Keys
    const validApiKeys = APIKeyManager.getValidAPIKeys();

    const apiKeyList = validApiKeys.map(key => ({
      prefix: key.substring(0, 7) + '***',
      format: 'lbk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      isValid: APIKeyManager.validateAPIKeyFormat(key)
    }));

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: apiKeyList,
        totalCount: validApiKeys.length,
        validCount: apiKeyList.filter(k => k.isValid).length
      }
    });

  } catch (error: any) {
    console.error('[API Key] 列出API Key失败:', error);

    return NextResponse.json(
      AuthUtils.createAuthErrorResponse('获取API Key列表失败', 'APIKEY_LIST_ERROR'),
      { status: 500 }
    );
  }
}