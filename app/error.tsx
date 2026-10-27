'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="main-wrap"><div className="empty-state"><h1>页面暂时未能加载</h1><p>请稍后重试。如果问题持续，请联系网站管理员检查服务状态。</p><button className="button primary" onClick={reset}>重新加载</button></div></main>}
