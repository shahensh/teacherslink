import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { schoolPublicApi } from '../../api/schoolPublicApi'
import { CheckCircle2, Globe, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import LiquidBackground from '../../components/LiquidBackground'

const PublicSchoolProfile = () => {
  const { slug } = useParams()
  const [school, setSchool] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { school: s, posts: p } = await schoolPublicApi.getSchoolBySlug(slug)
        if (!mounted) return
        setSchool(s)
        setPosts(p)
      } catch (e) {
        // noop
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [slug])

  if (loading) {
    return (
      <LiquidBackground className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </LiquidBackground>
    )
  }

  if (!school) {
    return (
      <LiquidBackground className="flex items-center justify-center">
        <p className="text-gray-600">School not found</p>
      </LiquidBackground>
    )
  }

  const isPlanActive = school.subscriptionExpiry ? new Date(school.subscriptionExpiry) > new Date() : false

  return (
    <LiquidBackground>
      {/* Cover */}
      <div className="relative h-48 sm:h-64 w-full">
        <img src={school.coverImage || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop'} alt="cover" className="h-full w-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16">
        <GlassCard className="p-0">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4 sm:gap-6">
              <img src={school.profileImage || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=300&auto=format&fit=crop'} alt="profile" className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-white/60 -mt-16"/>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{school.schoolName}</h1>
                  {/* Premium Verification Badge */}
                  {school?.plan?.isPremium && school?.plan?.expiresAt && new Date(school.plan.expiresAt) > new Date() && (
                    <span className="inline-flex items-center gap-1 text-blue-600 text-sm">
                      <ShieldCheck className="w-4 h-4"/> Verified Premium
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{school.description}</p>
                <div className="flex gap-4 flex-wrap mt-3 text-sm text-gray-700">
                  {school.address?.city && (
                    <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/>{school.address.city}, {school.address.state}</span>
                  )}
                  {school.contactInfo?.phone && (
                    <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4"/>{school.contactInfo.phone}</span>
                  )}
                  {school.contactInfo?.email && (
                    <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4"/>{school.contactInfo.email}</span>
                  )}
                  {school.contactInfo?.website && (
                    <a href={school.contactInfo.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                      <Globe className="w-4 h-4"/> Website
                    </a>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Subscription</div>
                  <div className={`text-sm font-medium ${isPlanActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {school.subscriptionPlan?.toUpperCase() || 'FREE'} {isPlanActive ? '(Active)' : '(Expired)'}
                  </div>
                  {school.subscriptionExpiry && (
                    <div className="text-xs text-gray-500">till {new Date(school.subscriptionExpiry).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Posts grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <Link to={`/school`} className="text-blue-600 text-sm hover:text-blue-700">Manage</Link>
          </div>
          {posts.length === 0 ? (
            <div className="text-gray-600 text-sm">No posts yet</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <GlassCard key={post._id} className="overflow-hidden p-0">
                  {post.media && post.media[0] && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={post.media[0].url} alt="post" className="w-full h-full object-cover"/>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-2">{new Date(post.createdAt).toLocaleDateString()}</div>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{post.caption}</p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.tags.slice(0,4).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </LiquidBackground>
  )
}

export default PublicSchoolProfile


