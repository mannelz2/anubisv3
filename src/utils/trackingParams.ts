export interface FacebookParams {
  fb_campaign_id?: string;
  fb_campaign_name?: string;
  fb_adset_name?: string;
  fb_ad_name?: string;
  fb_placement?: string;
}

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  src?: string;
}

export interface AdditionalTrackingParams {
  domain?: string;
  site_source?: string;
  tracking_id?: string;
}

export interface TrackingParams extends UtmParams, FacebookParams, AdditionalTrackingParams {
  all_url_params?: Record<string, string>;
}

const KNOWN_PARAM_MAPPINGS: Record<string, keyof TrackingParams> = {
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  utm_term: 'utm_term',
  utm_content: 'utm_content',
  src: 'src',
  cck: 'fb_campaign_id',
  cname: 'fb_campaign_name',
  adset: 'fb_adset_name',
  adname: 'fb_ad_name',
  placement: 'fb_placement',
  domain: 'domain',
  site_source: 'site_source',
  xgo: 'tracking_id',
};

export function extractTrackingParams(searchParams: URLSearchParams): TrackingParams {
  const trackingParams: TrackingParams = {};
  const allParams: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    allParams[key] = value;

    const mappedKey = KNOWN_PARAM_MAPPINGS[key];
    if (mappedKey) {
      trackingParams[mappedKey] = value;
    }
  });

  trackingParams.all_url_params = allParams;

  return trackingParams;
}

export function extractUtmParams(searchParams: URLSearchParams): UtmParams {
  return {
    utm_source: searchParams.get('utm_source') || undefined,
    utm_medium: searchParams.get('utm_medium') || undefined,
    utm_campaign: searchParams.get('utm_campaign') || undefined,
    utm_term: searchParams.get('utm_term') || undefined,
    utm_content: searchParams.get('utm_content') || undefined,
    src: searchParams.get('src') || undefined,
  };
}

export function serializeTrackingParams(params: TrackingParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'all_url_params') {
      searchParams.set(key, String(value));
    }
  });

  if (params.all_url_params) {
    Object.entries(params.all_url_params).forEach(([key, value]) => {
      if (!searchParams.has(key) && value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }

  return searchParams.toString();
}

export function mergeTrackingParams(...sources: (TrackingParams | undefined)[]): TrackingParams {
  const merged: TrackingParams = { all_url_params: {} };

  sources.forEach(source => {
    if (!source) return;

    Object.entries(source).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'all_url_params' && typeof value === 'object') {
          merged.all_url_params = {
            ...merged.all_url_params,
            ...value
          };
        } else {
          (merged as any)[key] = value;
        }
      }
    });
  });

  return merged;
}
