import React from 'react';

import { mount } from 'enzyme';
import chai, { expect } from 'chai';

import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import Rx from 'rxjs/Rx';

import { createMessage } from '../../../../src/notebook/kernel/messaging';

import { dummyStore } from '../../../utils';

import Editor from '../../../../src/notebook/components/cell/editor';

chai.use(sinonChai);


const complete = require('../../../../src/notebook/components/cell/editor/complete');

describe('Editor', () => {
  it('reaches out for code completion', (done) => {
    const sent = new Rx.Subject();
    const received = new Rx.Subject();

    const mockSocket = Rx.Subject.create(sent, received);

    const state = {
      app: {
        channels: {
          shell: mockSocket,
        },
      },
    };
    const store = {
      getState: () => state,
    };

    const editorWrapper = mount(
      <Editor
        completion
      />,
      {
        context: { store },
      }
    );
    expect(editorWrapper).to.not.be.null;

    const editor = editorWrapper.instance();
    const cm = {
      getCursor: () => 'MY CURSOR',
      getValue: () => 'MY VALUE',
    };

    const callback = sinon.spy();

    const completer = sinon.spy(complete, 'codeComplete');
    sent.subscribe(msg => {
      expect(msg.content.code).to.equal('MY VALUE');
      expect(completer).to.have.been.calledWith(state.app.channels, 'MY CURSOR', 'MY VALUE');
      completer.restore();
      done();
    });
    editor.completions(cm, callback);
  });
  it('doesn\'t try for code completion when not set', () => {
    const state = {
      app: {
        channels: {
          shell: 'turtle power',
        },
      },
    };
    const store = {
      getState: () => state,
    };

    const editorWrapper = mount(
      <Editor />,
      {
        context: { store },
      }
    );
    expect(editorWrapper).to.not.be.null;

    const editor = editorWrapper.instance();
    const cm = {
      getCursor: () => 'MY CURSOR',
      getValue: () => 'MY VALUE',
    };

    const callback = sinon.spy();

    const completer = sinon.spy(complete, 'codeComplete');
    editor.completions(cm, callback);
    expect(completer).to.have.not.been.called;
    completer.restore();
  });
});

describe('complete', () => {
  it('handles code completion', (done) => {
    const cursor = {
      line: 1,
      ch: 9,
    };
    const code = 'import thi';

    const sent = new Rx.Subject();
    const received = new Rx.Subject();

    const mockSocket = Rx.Subject.create(sent, received);

    const channels = {
      shell: mockSocket,
    };

    const {observable, message} = complete.codeComplete(channels, cursor, code);

    // Test the message created for sending
    expect(message.content).to.deep.equal({
      code: 'import thi',
      cursor_pos: 9,
    });

    // Craft the response to their message
    const response = createMessage('complete_reply');
    response.content = {
      matches: ['import this'],
      cursor_start: 9,
      cursor_end: 10, // Likely hokey values
    }
    response.parent_header = Object.assign({}, message.header);

    // Listen on the Observable
    observable.subscribe(
      msg => {
        expect(msg).to.deep.equal({
            from: { line: 1, ch: 9 },
            list: ["import this"],
            to: { ch: 10, line: 1 },
          });
      },
      err => { throw err },
      done
    );
    sent.next(message);
    received.next(response);
  });
});

describe('formChangeObject', () => {
  it('translates arguments to a nice Object', () => {
    expect(complete.formChangeObject(1,2)).to.deep.equal({cm: 1, change: 2});
  })
})

describe('pick', () => {
  it('plucks the codemirror handle', () => {
    // no clue what to call this
    const handle = {
      pick: sinon.spy(),
    }

    complete.pick(null, handle);
    expect(handle.pick).to.have.been.called;
  })
})
