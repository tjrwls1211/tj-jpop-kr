'use server';

import { confirmSong, getSongByTjNumber, setSongLlm, getLlmUsage, incrementLlmUsage } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const LLM_DAILY_LIMIT = Number(process.env.LLM_DAILY_LIMIT || 20);

function getGeminiClient() {
  if (!GEMINI_API_KEY) {
    throw new Error('환경변수 GEMINI_API_KEY가 설정되지 않았습니다.');
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

export async function confirmSongAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const titleKoMain = formData.get('title_ko_main') as string;

  confirmSong(id, titleKoMain);

  revalidatePath('/admin/pending');
  revalidatePath('/chart/[range]', 'page');
  revalidatePath('/search');
}

export async function requestLlmSuggestion(formData: FormData) {
  const tjNumber = (formData.get('tj_number') as string | null)?.trim();
  if (!tjNumber) return;
  if (!GEMINI_API_KEY) return;

  const todayUsage = getLlmUsage();
  if (todayUsage >= LLM_DAILY_LIMIT) {
    return;
  }

  const song = getSongByTjNumber(tjNumber) as any;
  if (!song) return;

  const prompt = [
    '당신은 일본 노래 제목을 한국어로 변환할 때, 사전적 의미 번역이나 일본어 음차보다 한국의 일반 대중이 실제로 가장 많이 사용하는 제목을 기준으로 답해야 합니다.',
    '',
    '여기서 "한국 대중"이란:',
    '- 멜론, 지니, 벅스 등 국내 음원 사이트',
    '- 유튜브 공식 음원/라이브 영상 제목',
    '- 노래방(TJ, KY) 이용자',
    '를 기준으로 하며, 일부 팬층이나 덕후 커뮤니티에서만 쓰이는 표현은 우선순위가 낮습니다.',
    '',
    '주의사항:',
    '- 일본어 발음을 그대로 옮긴 음차 표기는, 그것이 한국에서 압도적으로 가장 많이 쓰이는 경우가 아니라면 사용하지 마세요.',
    '- 원제의 의미에 충실한 번역보다, 한국에서 실제로 익숙하게 불리는 제목을 우선하세요.',
    '- 제목은 하나만, 가장 일반적인 표현 하나만 출력하세요.',
    '- 설명이나 부가 정보는 출력하지 마세요.',
    '',
    '입력 형식:',
    '노래 제목: [일본어 원제]',
    '',
    '출력 형식:',
    '[한국에서 가장 널리 쓰이는 한국어 제목]',
    '',
    '예시 입력:',
    '노래 제목: 打上花火',
    '가수: DAOKO×米津玄師',
    '',
    '예시 출력:',
    '쏘아올린 불꽃',
    '',
    '다음은 실제 입력입니다.',
    `노래 제목: ${song.title_ja}`,
    `가수: ${song.artist_ja}`
  ].join('\n');

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const llmText = result.response.text().trim();

    if (!llmText) return;

    setSongLlm(tjNumber, llmText);
    incrementLlmUsage();

    revalidatePath('/admin/pending');
    revalidatePath('/chart/[range]', 'page');
    revalidatePath('/search');
  } catch (error) {
    console.error('LLM 요청 실패:', error);
  }
}
