import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '@/blog/context/BlogContext.jsx';
import { BLOG_CATEGORIES } from '@/lib/constants.js';
import { Search, Heart, Eye, Clock, ChevronRight, Rss, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const PAGE_SIZE = 6;

function PostCard({ post, featured = false }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <Link to={`/blogs/${post.slug}`} className={cn(
                'group block bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300',
                featured && 'lg:flex'
            )}>
                {/* Cover */}
                <div className={cn(
                    `bg-gradient-to-br ${post.coverGradient} flex items-end p-6 flex-shrink-0`,
                    featured ? 'lg:w-2/5 min-h-[220px]' : 'h-44'
                )}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                        {post.category}
                    </span>
                </div>

                {/* Content */}
                <div className={cn('p-5 flex flex-col', featured && 'lg:p-8 justify-center')}>
                    {featured && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-3 uppercase tracking-wide">
                            <TrendingUp size={11} /> Featured
                        </span>
                    )}
                    <h3 className={cn(
                        'font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2',
                        featured ? 'text-xl lg:text-2xl mb-3' : 'text-base mb-2'
                    )}>
                        {post.title}
                    </h3>
                    <p className={cn('text-slate-500 line-clamp-2 text-sm', featured ? 'mb-5' : 'mb-4')}>
                        {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.slice(0, 3).map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-auto">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: post.author.avatarColor }}>
                            {post.author.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{post.author.name}</p>
                            <p className="text-[10px] text-slate-400">{format(new Date(post.publishedAt), 'dd MMM yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-0.5"><Clock size={11} /> {post.readTime}m</span>
                            <span className="flex items-center gap-0.5"><Heart size={11} /> {post.likes}</span>
                            <span className="flex items-center gap-0.5"><Eye size={11} /> {post.views.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function Blogs() {
    const { getPublishedPosts } = useBlog();
    const publishedPosts = getPublishedPosts();
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        return publishedPosts.filter(p => {
            const matchCat = activeCategory === 'All' || p.category === activeCategory;
            const matchSearch = !search
                || p.title.toLowerCase().includes(search.toLowerCase())
                || p.excerpt.toLowerCase().includes(search.toLowerCase())
                || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
            return matchCat && matchSearch;
        });
    }, [publishedPosts, activeCategory, search]);

    const featured = filtered[0];
    const rest = filtered.slice(1);
    const totalPages = Math.ceil(rest.length / PAGE_SIZE);
    const paged = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-teal-600 to-emerald-500 text-white px-4 py-16 text-center">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white blur-3xl" />
                </div>
                <div className="relative max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium mb-6">
                        <Rss size={14} /> Health Insights From Our Experts
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                        Sanjiwani <span className="text-emerald-200">Health Blog</span>
                    </h1>
                    <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
                        Evidence-based health articles, doctor stories, and wellness tips written by medical professionals.
                    </p>
                    {/* Search */}
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                        <input
                            type="text"
                            placeholder="Search articles, topics, tags…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {['All', ...BLOG_CATEGORIES].map(cat => (
                        <button key={cat}
                            onClick={() => { setActiveCategory(cat); setPage(1); }}
                            className={cn(
                                'px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                                activeCategory === cat
                                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
                {/* Results info */}
                {search && (
                    <p className="text-sm text-slate-500">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
                    </p>
                )}

                {/* Featured */}
                {featured && !search && (
                    <section>
                        <PostCard post={featured} featured />
                    </section>
                )}

                {/* Grid */}
                {(search ? filtered : paged).length > 0 ? (
                    <section>
                        {!search && rest.length > 0 && (
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-5">
                                {activeCategory === 'All' ? 'Latest Articles' : activeCategory}
                            </h2>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {(search ? filtered : paged).map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">🩺</div>
                        <p className="text-slate-500 font-medium">No articles found</p>
                        <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
                    </div>
                )}

                {/* Pagination */}
                {!search && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)}
                                className={cn('h-9 w-9 rounded-xl text-sm font-medium transition',
                                    page === p ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary')}>
                                {p}
                            </button>
                        ))}
                    </div>
                )}

                {/* Blogger CTA */}
                <div className="bg-gradient-to-r from-primary/5 via-teal-50 to-emerald-50 rounded-2xl border border-primary/15 p-8 text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Are you a healthcare professional?</h3>
                    <p className="text-sm text-slate-500 mb-4">Share your expertise and reach thousands of patients through the Sanjiwani Health Blog.</p>
                    <Link to="/blogger/login"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">
                        Start Writing <ChevronRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
