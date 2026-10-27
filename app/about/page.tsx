import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
export const metadata={title:'关于收录'};
export default function AboutPage(){return <SiteShell active="about"><div className="page-heading"><div><h1>让软件选择，有据可依</h1><p>F · 出海工具库的收录方式。</p></div></div><article className="about-content"><section><h2>围绕工作，整理软件</h2><p>我们面向跨境电商和外贸从业者，按选品、获客、内容、经营和履约等实际工作场景整理软件。AI 是其中一种能力，适不适合你的工作，才是选择的起点。</p></section><section><h2>信息可以追溯</h2><p>产品资料根据官网等官方公开来源整理，并标注资料核对日期。收费说明用于帮助初步判断，具体价格、可用地区、功能和服务条款以产品官网为准。</p><p>这里的收录和推荐不代表实际测试结论，也不保证产品效果。我们不使用虚构评分、用户量或未经验证的体验。</p></section><section><h2>同时说清适用范围和限制</h2><p>每款软件尽量说明适用人群、主要功能与选择前需要了解的条件。即使功能相似，团队规模、语言、业务平台和接入成本也可能不同，建议先结合自己的任务试用。</p></section><section><h2>持续维护，保留判断</h2><p>软件会变化，资料也需要更新。运营人员可以修订产品资料、调整分类，或在产品不再适合展示时下架。目录仅提供选型信息，购买、账户开通和软件服务均由对应厂商提供。</p></section><Link className="button primary" href="/products">开始找软件 <ArrowRight size={16}/></Link></article></SiteShell>}
