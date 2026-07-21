import {
  createSocialImageResponse,
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/lib/seo/social-image";
import { SITE_OG_DESCRIPTION, SITE_OG_IMAGE_ALT, SITE_OG_TITLE } from "@/lib/seo/site";

export const runtime = "edge";
export const alt = SITE_OG_IMAGE_ALT;
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

export default function OpenGraphImage() {
  return createSocialImageResponse({
    title: SITE_OG_TITLE,
    subtitle: SITE_OG_DESCRIPTION,
  });
}
