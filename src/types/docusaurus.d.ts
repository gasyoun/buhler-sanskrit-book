/// <reference types="@docusaurus/module-type-aliases" />

// @docusaurus/module-type-aliases@3.9.1 does not declare `@theme/Heading`
// and gives `@theme/Layout` a children-only Props, while the real
// theme-classic components accept more (Heading exists at runtime since
// 3.6; Layout forwards `title`/`description` to PageMetadata). Declare the
// missing module and merge the used props here so plain `tsc` passes.
declare module '@theme/Heading' {
  import type {ComponentProps, ReactNode} from 'react';

  export type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  export interface Props extends ComponentProps<'h1'> {
    readonly as?: HeadingType;
    readonly id?: string;
  }

  export default function Heading(props: Props): ReactNode;
}

declare module '@theme/Layout' {
  export interface Props {
    readonly title?: string;
    readonly description?: string;
  }
}
