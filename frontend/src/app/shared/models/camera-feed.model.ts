export type CameraStreamType = 'hls' | 'mjpeg' | 'youtube' | 'iframe' | 'jpeg-refresh';

export interface CameraFeedItem {
  readonly id: string;
  readonly name: string;
  readonly nameTr?: string;
  readonly lat: number;
  readonly lng: number;
  readonly streamUrl: string;
  readonly type: CameraStreamType;
  readonly source: string;
  readonly tos: string;
  readonly countryIso?: string;
  readonly city?: string;
  readonly tags?: readonly string[];
  readonly preview?: string;
}

export interface CameraFeedCollection {
  readonly version: number;
  readonly updated: string;
  readonly disclaimer: string;
  readonly items: readonly CameraFeedItem[];
}
