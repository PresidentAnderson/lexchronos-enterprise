/**
 * Analytics Integration for LexChronos
 * @description Comprehensive analytics tracking with multiple providers
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  plan?: string;
  signupDate?: string;
  [key: string]: any;
}

interface PageViewData {
  path: string;
  title?: string;
  referrer?: string;
  userId?: string;
}

class AnalyticsManager {
  private initialized = false;
  private providers: Set<string> = new Set();
  private config: any = null;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeBrowser();
    }
  }

  private async initializeBrowser() {
    try {
      // Load configuration
      this.config = {
        ga4Id: process.env.NEXT_PUBLIC_GA4_ID,
        gtmId: process.env.NEXT_PUBLIC_GTM_ID,
        fbPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
        clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
        posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
        environment: process.env.NODE_ENV || 'development'
      };

      await this.initializeProviders();
      this.initialized = true;
      
      // Process queued events
      this.processQueue();
      
      console.log(`✅ Analytics initialized with providers: ${Array.from(this.providers).join(', ')}`);
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async initializeProviders() {
    // Google Analytics 4
    if (this.config.ga4Id) {
      await this.initializeGA4();
      this.providers.add('ga4');
    }

    // Google Tag Manager
    if (this.config.gtmId) {
      await this.initializeGTM();
      this.providers.add('gtm');
    }

    // Facebook Pixel
    if (this.config.fbPixelId) {
      await this.initializeFacebookPixel();
      this.providers.add('facebook');
    }

    // Microsoft Clarity
    if (this.config.clarityProjectId) {
      await this.initializeClarity();
      this.providers.add('clarity');
    }

    // PostHog
    if (this.config.posthogKey) {
      await this.initializePostHog();
      this.providers.add('posthog');
    }

    // Mixpanel
    if (this.config.mixpanelToken) {
      await this.initializeMixpanel();
      this.providers.add('mixpanel');
    }
  }

  private async initializeGA4() {
    try {
      // Load gtag
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.ga4Id}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;

      gtag('js', new Date());
      gtag('config', this.config.ga4Id, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
        anonymize_ip: true,
        cookie_flags: 'SameSite=Strict;Secure'
      });

      console.log('✅ GA4 initialized');
    } catch (error) {
      console.error('Failed to initialize GA4:', error);
    }
  }

  private async initializeGTM() {
    try {
      // Google Tag Manager
      (function(w: any, d: any, s: any, l: any, i: any) {
        w[l] = w[l] || [];
        w[l].push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', this.config.gtmId);

      console.log('✅ GTM initialized');
    } catch (error) {
      console.error('Failed to initialize GTM:', error);
    }
  }

  private async initializeFacebookPixel() {
    try {
      // Facebook Pixel
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      (window as any).fbq('init', this.config.fbPixelId);
      (window as any).fbq('track', 'PageView');

      console.log('✅ Facebook Pixel initialized');
    } catch (error) {
      console.error('Failed to initialize Facebook Pixel:', error);
    }
  }

  private async initializeClarity() {
    try {
      // Microsoft Clarity
      (function(c: any, l: any, a: any, r: any, i: any, t: any, y: any) {
        c[a] = c[a] || function() {
          (c[a].q = c[a].q || []).push(arguments);
        };
        t = l.createElement(r);
        t.async = 1;
        t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", this.config.clarityProjectId);

      console.log('✅ Microsoft Clarity initialized');
    } catch (error) {
      console.error('Failed to initialize Microsoft Clarity:', error);
    }
  }

  private async initializePostHog() {
    try {
      // PostHog
      const script = document.createElement('script');
      script.src = 'https://app.posthog.com/static/array.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        (window as any).posthog.init(this.config.posthogKey, {
          api_host: this.config.posthogHost,
          loaded: function(posthog: any) {
            if (this.config.environment === 'development') {
              posthog.debug();
            }
          }
        });
      };

      console.log('✅ PostHog initialized');
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  private async initializeMixpanel() {
    try {
      // Mixpanel
      (function(f: any, b: any) {
        if (!b.__SV) {
          var e, g, i, h;
          window.mixpanel = b;
          b._i = [];
          b.init = function(e: any, f: any, c: any) {
            function g(a: any, d: any) {
              var b = d.split(".");
              2 == b.length && ((a = a[b[0]]), (d = b[1]));
              a[d] = function() {
                a.push([d].concat(Array.prototype.slice.call(arguments, 0)));
              };
            }
            var a = b;
            "undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel");
            a.people = a.people || [];
            a.toString = function(a: any) {
              var d = "mixpanel";
              "mixpanel" !== c && (d += "." + c);
              a || (d += " (stub)");
              return d;
            };
            a.people.toString = function() {
              return a.toString(1) + ".people (stub)";
            };
            i = "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
            for (h = 0; h < i.length; h++) g(a, i[h]);
            var j = "set set_once union unset remove delete".split(" ");
            a.get_group = function() {
              function b(c: any) {
                d[c] = function() {
                  call2_args = arguments;
                  call2 = [c].concat(Array.prototype.slice.call(call2_args, 0));
                  a.push([e, call2]);
                };
              }
              for (var d = {}, e = ["get_group"].concat(Array.prototype.slice.call(arguments, 0)), c = 0; c < j.length; c++) b(j[c]);
              return d;
            };
            b._i.push([e, f, c]);
          };
          b.__SV = 1.2;
          e = f.createElement("script");
          e.type = "text/javascript";
          e.async = !0;
          e.src = "undefined" !== typeof MIXPANEL_CUSTOM_LIB_URL ? MIXPANEL_CUSTOM_LIB_URL : "file:" === f.location.protocol && "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//) ? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js" : "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
          g = f.getElementsByTagName("script")[0];
          g.parentNode.insertBefore(e, g);
        }
      })(document, window.mixpanel || []);

      (window as any).mixpanel.init(this.config.mixpanelToken);

      console.log('✅ Mixpanel initialized');
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.trackEvent(event.name, event.properties, event.userId);
      }
    }
  }

  // Public methods
  trackEvent(name: string, properties: Record<string, any> = {}, userId?: string) {
    if (!this.initialized) {
      this.queue.push({ name, properties, userId, timestamp: Date.now() });
      return;
    }

    try {
      const eventData = {
        ...properties,
        timestamp: new Date().toISOString(),
        user_id: userId,
        page: window.location.pathname,
        referrer: document.referrer
      };

      // Google Analytics 4
      if (this.providers.has('ga4') && (window as any).gtag) {
        (window as any).gtag('event', name, eventData);
      }

      // Facebook Pixel
      if (this.providers.has('facebook') && (window as any).fbq) {
        (window as any).fbq('track', name, properties);
      }

      // PostHog
      if (this.providers.has('posthog') && (window as any).posthog) {
        (window as any).posthog.capture(name, eventData);
      }

      // Mixpanel
      if (this.providers.has('mixpanel') && (window as any).mixpanel) {
        (window as any).mixpanel.track(name, eventData);
      }

    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  trackPageView(data: PageViewData) {
    if (!this.initialized) {
      this.queue.push({ name: 'page_view', properties: data });
      return;
    }

    try {
      // Google Analytics 4
      if (this.providers.has('ga4') && (window as any).gtag) {
        (window as any).gtag('config', this.config.ga4Id, {
          page_path: data.path,
          page_title: data.title
        });
      }

      // PostHog
      if (this.providers.has('posthog') && (window as any).posthog) {
        (window as any).posthog.capture('$pageview', {
          $current_url: window.location.href,
          $host: window.location.host,
          $pathname: data.path,
          $title: data.title
        });
      }

      // Mixpanel
      if (this.providers.has('mixpanel') && (window as any).mixpanel) {
        (window as any).mixpanel.track('Page Viewed', {
          page: data.path,
          title: data.title,
          referrer: data.referrer
        });
      }

    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  identifyUser(userData: UserProperties) {
    if (!this.initialized) return;

    try {
      // Google Analytics 4
      if (this.providers.has('ga4') && (window as any).gtag) {
        (window as any).gtag('config', this.config.ga4Id, {
          user_id: userData.userId
        });
      }

      // PostHog
      if (this.providers.has('posthog') && (window as any).posthog) {
        (window as any).posthog.identify(userData.userId, userData);
      }

      // Mixpanel
      if (this.providers.has('mixpanel') && (window as any).mixpanel) {
        (window as any).mixpanel.identify(userData.userId);
        (window as any).mixpanel.people.set(userData);
      }

    } catch (error) {
      console.error('Error identifying user:', error);
    }
  }

  resetUser() {
    if (!this.initialized) return;

    try {
      // PostHog
      if (this.providers.has('posthog') && (window as any).posthog) {
        (window as any).posthog.reset();
      }

      // Mixpanel
      if (this.providers.has('mixpanel') && (window as any).mixpanel) {
        (window as any).mixpanel.reset();
      }

    } catch (error) {
      console.error('Error resetting user:', error);
    }
  }

  // Convenience methods for common events
  trackSignup(method: string, userId: string) {
    this.trackEvent('user_signup', { method }, userId);
  }

  trackLogin(method: string, userId: string) {
    this.trackEvent('user_login', { method }, userId);
  }

  trackPurchase(amount: number, currency: string, productId: string, userId?: string) {
    this.trackEvent('purchase', {
      value: amount,
      currency,
      product_id: productId
    }, userId);

    // Facebook Pixel Purchase Event
    if (this.providers.has('facebook') && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: amount,
        currency: currency
      });
    }
  }

  trackSubscription(tier: string, amount: number, currency: string, userId?: string) {
    this.trackEvent('subscription_created', {
      subscription_tier: tier,
      value: amount,
      currency
    }, userId);
  }

  // Get analytics status
  getStatus() {
    return {
      initialized: this.initialized,
      providers: Array.from(this.providers),
      queueSize: this.queue.length
    };
  }
}

// Create singleton instance
const analytics = new AnalyticsManager();

export default analytics;