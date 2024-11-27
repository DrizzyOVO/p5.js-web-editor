import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { useDispatch } from 'react-redux';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '../../../test-utils';
import { FileNode } from './FileNode';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn()
}));

describe('<FileNode />', () => {
  const mockDispatch = jest.fn();
  const mockStore = configureStore([]);

  beforeEach(() => {
    useDispatch.mockReturnValue(mockDispatch);
  });

  const changeName = (newFileName) => {
    const renameButton = screen.getByText(/Rename/i);
    fireEvent.click(renameButton);

    const input = screen.getByTestId('input');
    fireEvent.change(input, { target: { value: newFileName } });
    fireEvent.blur(input);
  };

  const expectFileNameToBe = async (expectedName) => {
    const name = screen.getByTestId('file-name');
    await waitFor(() => within(name).queryByText(expectedName));
  };

  const renderFileNode = (fileType, extraProps = {}) => {
    const initialState = {
      files: [
        {
          id: '0',
          name: fileType === 'folder' ? 'afolder' : 'test.jsx',
          fileType
        }
      ],
      user: { authenticated: false }
    };

    const store = mockStore(initialState);

    const props = {
      ...extraProps,
      id: '0',
      name: fileType === 'folder' ? 'afolder' : 'test.jsx',
      fileType,
      canEdit: true,
      children: [],
      authenticated: false,
      setSelectedFile: jest.fn(),
      deleteFile: jest.fn(),
      updateFileName: jest.fn(),
      resetSelectedFile: jest.fn(),
      newFile: jest.fn(),
      newFolder: jest.fn(),
      showFolderChildren: jest.fn(),
      hideFolderChildren: jest.fn(),
      openUploadFileModal: jest.fn(),
      setProjectName: jest.fn()
    };

    render(
      <Provider store={store}>
        <FileNode {...props} />
      </Provider>
    );

    return { store, props };
  };

  describe('fileType: file', () => {
    it('cannot change to an empty name', async () => {
      const { props } = renderFileNode('file');

      changeName('');

      await waitFor(() => expect(mockDispatch).not.toHaveBeenCalled());
      await expectFileNameToBe(props.name);
    });

    it('can change to a valid filename', async () => {
      const newName = 'newname.jsx';
      const { props } = renderFileNode('file');

      changeName(newName);

      await waitFor(() =>
        expect(props.updateFileName).toHaveBeenCalledWith(props.id, newName)
      );
      await expectFileNameToBe(newName);
    });

    it('must have an extension', async () => {
      const newName = 'newname';
      const { props } = renderFileNode('file');

      changeName(newName);

      await waitFor(() => expect(mockDispatch).not.toHaveBeenCalled());
      await expectFileNameToBe(props.name);
    });

    it('can change to a different extension', async () => {
      const mockConfirm = jest.fn(() => true);
      window.confirm = mockConfirm;

      const newName = 'newname.gif';
      const { props } = renderFileNode('file');

      changeName(newName);

      expect(mockConfirm).toHaveBeenCalled();
      await waitFor(() =>
        expect(props.updateFileName).toHaveBeenCalledWith(props.id, newName)
      );
      await expectFileNameToBe(newName);
    });

    it('cannot be just an extension', async () => {
      const newName = '.jsx';
      const { props } = renderFileNode('file');

      changeName(newName);

      await waitFor(() => expect(mockDispatch).not.toHaveBeenCalled());
      await expectFileNameToBe(props.name);
    });
  });

  describe('fileType: folder', () => {
    it('cannot change to an empty name', async () => {
      const { props } = renderFileNode('folder');

      changeName('');

      await waitFor(() => expect(mockDispatch).not.toHaveBeenCalled());
      await expectFileNameToBe(props.name);
    });

    it('can change to another name', async () => {
      const newName = 'foldername';
      const { props } = renderFileNode('folder');

      changeName(newName);

      await waitFor(() =>
        expect(props.updateFileName).toHaveBeenCalledWith(props.id, newName)
      );
      await expectFileNameToBe(newName);
    });

    it('cannot have a file extension', async () => {
      const newName = 'foldername.jsx';
      const { props } = renderFileNode('folder');

      changeName(newName);

      await waitFor(() => expect(mockDispatch).not.toHaveBeenCalled());
      await expectFileNameToBe(props.name);
    });
  });
});
