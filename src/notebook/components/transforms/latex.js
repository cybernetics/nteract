/* @flow */
import React from 'react';
import mathjaxHelper from 'mathjax-electron';

type Props = {
  data: string,
};

export default class LaTeXDisplay extends React.Component {
  props: Props;
  el: HTMLElement;

  componentDidMount(): void {
    this.el.innerHTML = this.props.data;
    mathjaxHelper.loadAndTypeset(document, this.el);
  }

  shouldComponentUpdate(): boolean {
    return false;
  }

  render(): ?React.Element<any> {
    return (
      <div ref={(el) => { this.el = el; }} />
    );
  }
}
