require 'rubygems'
require 'rack'
require 'rack/contrib'
require 'sinatra'
require './server'

use Rack::JSONP

root=Dir.pwd
puts ">>> Serving: #{root}/../"

run Rack::Directory.new("#{root}/../")

map "/poller" do
  run Sinatra::Application
end

