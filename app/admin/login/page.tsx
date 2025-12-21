import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { loginAction } from './actions';

export default async function AdminLoginPage() {
  if (await isAuthenticated()) {
    redirect('/admin/pending');
  }

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="admin-card">
        <h1 style={{ marginBottom: '20px' }}>관리자 로그인</h1>
        <form action={loginAction}>
          <div className="form-group">
            <label className="label">비밀번호</label>
            <input
              type="password"
              name="password"
              className="input"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }}>
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
