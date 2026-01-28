import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '~/server/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/contests'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Create or update user record in our database
      try {
        await db.user.upsert({
          where: { id: data.user.id },
          create: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name ?? data.user.user_metadata?.full_name ?? null,
            image: data.user.user_metadata?.avatar_url ?? null,
            onboardingCompleted: false,
          },
          update: {
            email: data.user.email,
            name: data.user.user_metadata?.name ?? data.user.user_metadata?.full_name ?? null,
            image: data.user.user_metadata?.avatar_url ?? null,
          },
        })
        
        // Redirect to onboarding if user hasn't completed it
        const user = await db.user.findUnique({
          where: { id: data.user.id },
          select: { onboardingCompleted: true, leetcodeUsername: true },
        })
        
        if (user && !user.leetcodeUsername) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      } catch (dbError) {
        console.error('Database sync error:', dbError)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Auth callback error:', error)
  }

  return NextResponse.redirect(`${origin}/auth/signin`)
}
