import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
import * as WebBrowser from 'expo-web-browser';

globalThis.Buffer = globalThis.Buffer ?? Buffer;

WebBrowser.maybeCompleteAuthSession();

import 'expo-router/entry';
